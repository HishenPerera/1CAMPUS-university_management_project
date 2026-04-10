import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "../../api/axiosInstance";
import "./DatabaseManagement.css";

const TABLE_ICONS = {
    users:                "bi-people-fill",
    students:             "bi-mortarboard-fill",
    student_applications: "bi-file-earmark-person-fill",
    modules:              "bi-journal-bookmark-fill",
    lecturer_modules:     "bi-link-45deg",
    module_materials:     "bi-folder-fill",
    quizzes:              "bi-patch-question-fill",
    quiz_questions:       "bi-question-circle-fill",
    quiz_submissions:     "bi-check2-square",
    activity_logs:        "bi-journal-text",
    tickets:              "bi-ticket-fill",
};

const TABLE_COLORS = {
    users:                "#5a67d8",
    students:             "#38b2ac",
    student_applications: "#ed8936",
    modules:              "#805ad5",
    lecturer_modules:     "#3182ce",
    module_materials:     "#e53e3e",
    quizzes:              "#d69e2e",
    quiz_questions:       "#38a169",
    quiz_submissions:     "#00b5d8",
    activity_logs:        "#718096",
    tickets:              "#e91e8c",
};

function formatCell(value) {
    if (value === null || value === undefined) return <span className="dbm-null">null</span>;
    if (typeof value === "boolean") return <span className={`dbm-bool dbm-bool--${value}`}>{String(value)}</span>;
    if (typeof value === "object") return <span className="dbm-json">{JSON.stringify(value).slice(0, 80)}</span>;
    const str = String(value);
    if (str.length > 80) return <span title={str}>{str.slice(0, 80)}…</span>;
    return str;
}

export default function DatabaseManagement() {
    const [tables, setTables]       = useState([]);
    const [tablesLoading, setTablesLoading] = useState(true);
    const [activeTable, setActiveTable] = useState(null);

    // Table data state
    const [columns, setColumns]     = useState([]);
    const [rows, setRows]           = useState([]);
    const [total, setTotal]         = useState(0);
    const [page, setPage]           = useState(1);
    const [pageSize]                = useState(20);
    const [sortCol, setSortCol]     = useState("id");
    const [sortDir, setSortDir]     = useState("asc");
    const [search, setSearch]       = useState("");
    const [dataLoading, setDataLoading] = useState(false);
    const [dataError, setDataError] = useState("");

    // Delete modal
    const [deleteRow, setDeleteRow] = useState(null);
    const [deleting, setDeleting]   = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const searchRef = useRef(null);

    // ── Load table list ──────────────────────────────────────────────
    const loadTables = useCallback(async () => {
        setTablesLoading(true);
        try {
            const res = await axios.get("/webadmin/db/tables");
            setTables(res.data);
        } catch {
            setTables([]);
        } finally {
            setTablesLoading(false);
        }
    }, []);

    useEffect(() => { loadTables(); }, [loadTables]);

    // ── Load table data ──────────────────────────────────────────────
    const loadData = useCallback(async (tableName, pg, sc, sd, sr) => {
        if (!tableName) return;
        setDataLoading(true);
        setDataError("");
        try {
            const res = await axios.get(`/webadmin/db/tables/${tableName}`, {
                params: { page: pg, limit: pageSize, sort: sc, dir: sd, search: sr },
            });
            setColumns(res.data.columns);
            setRows(res.data.rows);
            setTotal(res.data.total);
        } catch (err) {
            setDataError(err.response?.data?.message || "Failed to load table data.");
        } finally {
            setDataLoading(false);
        }
    }, [pageSize]);

    useEffect(() => {
        loadData(activeTable, page, sortCol, sortDir, search);
    }, [activeTable, page, sortCol, sortDir, loadData]); // search debounced separately

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => {
            if (activeTable) {
                setPage(1);
                loadData(activeTable, 1, sortCol, sortDir, search);
            }
        }, 350);
        return () => clearTimeout(t);
    }, [search]); // eslint-disable-line

    const selectTable = (name) => {
        setActiveTable(name);
        setPage(1);
        setSortCol("id");
        setSortDir("asc");
        setSearch("");
        setDataError("");
    };

    const handleSort = (col) => {
        if (sortCol === col) {
            setSortDir(d => d === "asc" ? "desc" : "asc");
        } else {
            setSortCol(col);
            setSortDir("asc");
        }
        setPage(1);
    };

    // ── Delete ───────────────────────────────────────────────────────
    const confirmDelete = async () => {
        if (!deleteRow) return;
        setDeleting(true);
        setDeleteError("");
        // Prefer 'id' as PK, fall back to first column
        const pk = columns.includes("id") ? deleteRow.id : deleteRow[columns[0]];
        try {
            await axios.delete(`/webadmin/db/tables/${activeTable}/${pk}`);
            setDeleteRow(null);
            setPage(1);
            loadData(activeTable, 1, sortCol, sortDir, search);
            loadTables();
        } catch (err) {
            setDeleteError(err.response?.data?.message || "Delete failed.");
        } finally {
            setDeleting(false);
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <div className="dbm-page">
            {/* Page header */}
            <div className="dbm-header">
                <div>
                    <h2 className="dbm-title">
                        <i className="bi bi-database-fill-gear" /> Database Management
                    </h2>
                    <p className="dbm-subtitle">Browse, filter, sort and manage all database tables</p>
                </div>
                <button className="dbm-refresh-btn" onClick={loadTables} title="Refresh table list">
                    <i className="bi bi-arrow-clockwise" /> Refresh
                </button>
            </div>

            <div className="dbm-body">
                {/* ── Sidebar: Table List ─────────────────────────────── */}
                <aside className="dbm-sidebar">
                    <div className="dbm-sidebar-title">Tables</div>
                    {tablesLoading ? (
                        <div className="dbm-sidebar-loading"><div className="dbm-spin" /> Loading…</div>
                    ) : (
                        <ul className="dbm-table-list">
                            {tables.map(t => (
                                <li
                                    key={t.name}
                                    className={`dbm-table-item ${activeTable === t.name ? "dbm-table-item--active" : ""}`}
                                    onClick={() => selectTable(t.name)}
                                    style={{ "--t-color": TABLE_COLORS[t.name] || "#5a67d8" }}
                                >
                                    <span className="dbm-table-icon">
                                        <i className={`bi ${TABLE_ICONS[t.name] || "bi-table"}`} />
                                    </span>
                                    <span className="dbm-table-name">{t.name}</span>
                                    <span className="dbm-table-count">{t.rows.toLocaleString()}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </aside>

                {/* ── Main: Table Viewer ─────────────────────────────── */}
                <div className="dbm-main">
                    {!activeTable ? (
                        <div className="dbm-empty-state">
                            <i className="bi bi-database dbm-empty-icon" />
                            <h3>Select a table</h3>
                            <p>Choose a table from the sidebar to view and manage its data.</p>
                        </div>
                    ) : (
                        <>
                            {/* Toolbar */}
                            <div className="dbm-toolbar">
                                <div className="dbm-toolbar-left">
                                    <span className="dbm-active-table">
                                        <i className={`bi ${TABLE_ICONS[activeTable] || "bi-table"}`} />
                                        {activeTable}
                                    </span>
                                    {!dataLoading && (
                                        <span className="dbm-total-badge">{total.toLocaleString()} rows</span>
                                    )}
                                </div>
                                <div className="dbm-search-wrap">
                                    <i className="bi bi-search dbm-search-icon" />
                                    <input
                                        ref={searchRef}
                                        className="dbm-search"
                                        placeholder={`Search in ${activeTable}…`}
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                    {search && (
                                        <button className="dbm-search-clear" onClick={() => setSearch("")}>
                                            <i className="bi bi-x" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Error */}
                            {dataError && <div className="dbm-error"><i className="bi bi-exclamation-triangle-fill" /> {dataError}</div>}

                            {/* Table */}
                            <div className="dbm-table-wrap">
                                {dataLoading ? (
                                    <div className="dbm-data-loading"><div className="dbm-spin" /> Loading data…</div>
                                ) : rows.length === 0 ? (
                                    <div className="dbm-data-empty">
                                        <i className="bi bi-inbox" />
                                        <p>{search ? "No rows match your search." : "This table is empty."}</p>
                                    </div>
                                ) : (
                                    <table className="dbm-table">
                                        <thead>
                                            <tr>
                                                {columns.map(col => (
                                                    <th
                                                        key={col}
                                                        className={`dbm-th ${sortCol === col ? "dbm-th--sorted" : ""}`}
                                                        onClick={() => handleSort(col)}
                                                    >
                                                        {col}
                                                        <span className="dbm-sort-icon">
                                                            {sortCol === col
                                                                ? (sortDir === "asc" ? " ▲" : " ▼")
                                                                : " ⇅"}
                                                        </span>
                                                    </th>
                                                ))}
                                                <th className="dbm-th dbm-th--action">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((row, i) => {
                                                const pkVal = row.id ?? row[columns[0]];
                                                return (
                                                    <tr key={`${pkVal}-${i}`} className="dbm-tr">
                                                        {columns.map(col => (
                                                            <td key={col} className="dbm-td">
                                                                {formatCell(row[col])}
                                                            </td>
                                                        ))}
                                                        <td className="dbm-td dbm-td--action">
                                                            <button
                                                                className="dbm-del-btn"
                                                                onClick={() => { setDeleteRow(row); setDeleteError(""); }}
                                                                title="Delete this row"
                                                            >
                                                                <i className="bi bi-trash3-fill" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Pagination */}
                            {!dataLoading && totalPages > 1 && (
                                <div className="dbm-pagination">
                                    <button className="dbm-pg-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
                                    <button className="dbm-pg-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                                        const start = Math.max(1, Math.min(page - 3, totalPages - 6));
                                        return start + i;
                                    }).map(n => (
                                        <button
                                            key={n}
                                            className={`dbm-pg-btn ${n === page ? "dbm-pg-btn--active" : ""}`}
                                            onClick={() => setPage(n)}
                                        >{n}</button>
                                    ))}
                                    <button className="dbm-pg-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
                                    <button className="dbm-pg-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
                                    <span className="dbm-pg-info">
                                        Page {page} of {totalPages} &nbsp;·&nbsp; {total.toLocaleString()} rows
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── Delete Confirm Modal ───────────────────────────────── */}
            {deleteRow && createPortal(
                <div className="dbm-modal-backdrop" onClick={() => !deleting && setDeleteRow(null)}>
                    <div className="dbm-modal" onClick={e => e.stopPropagation()}>
                        <div className="dbm-modal-header">
                            <h3><i className="bi bi-trash3-fill" /> Delete Row</h3>
                            <button className="dbm-modal-close" onClick={() => setDeleteRow(null)} disabled={deleting}>
                                <i className="bi bi-x" />
                            </button>
                        </div>
                        <div className="dbm-modal-body">
                            <p className="dbm-modal-warn">
                                You are about to permanently delete this row from <strong>{activeTable}</strong>.
                                This action <strong>cannot be undone</strong>.
                            </p>
                            <div className="dbm-row-preview">
                                {Object.entries(deleteRow).slice(0, 6).map(([k, v]) => (
                                    <div key={k} className="dbm-preview-row">
                                        <span className="dbm-preview-key">{k}</span>
                                        <span className="dbm-preview-val">{formatCell(v)}</span>
                                    </div>
                                ))}
                                {Object.keys(deleteRow).length > 6 && (
                                    <div className="dbm-preview-more">+{Object.keys(deleteRow).length - 6} more columns…</div>
                                )}
                            </div>
                            {deleteError && <div className="dbm-modal-error"><i className="bi bi-exclamation-triangle-fill" /> {deleteError}</div>}
                        </div>
                        <div className="dbm-modal-actions">
                            <button className="dbm-cancel-btn" onClick={() => setDeleteRow(null)} disabled={deleting}>Cancel</button>
                            <button className="dbm-delete-confirm-btn" onClick={confirmDelete} disabled={deleting}>
                                {deleting ? <><div className="dbm-spin dbm-spin--sm" /> Deleting…</> : <><i className="bi bi-trash3-fill" /> Yes, Delete</>}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
