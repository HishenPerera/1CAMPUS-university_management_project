import React, { useState, useEffect } from 'react';
import axios from "../../api/axiosInstance";
import './OnlineEbooks.css';

function OnlineEbooks() {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('education');
    const [books, setBooks] = useState([]);
    const [readingBook, setReadingBook] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);

    const [isSuggesting, setIsSuggesting] = useState(false);

    const performSearch = async (searchQuery, searchCategory) => {
        setLoading(true);
        setError(null);
        setHasSearched(true);

        try {
            const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&subject=${encodeURIComponent(searchCategory)}&has_fulltext=true&limit=20`);
            if (!res.ok) throw new Error("Failed to fetch books");
            const data = await res.json();
            
            const formattedBooks = data.docs.filter(doc => doc.title && doc.cover_i).map(doc => ({
                id: doc.key,
                title: doc.title,
                author: doc.author_name ? doc.author_name.join(', ') : 'Unknown Author',
                year: doc.first_publish_year,
                coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null,
                readUrl: `https://openlibrary.org${doc.key}`,
                ia: doc.ia && doc.ia.length > 0 ? doc.ia[0] : null
            }));

            setBooks(formattedBooks);
        } catch (err) {
            setError(err.message || 'Something went wrong while searching.');
        } finally {
            setLoading(false);
        }
    };

// Maps degree keywords to specific, relevant book search topics for suggestions
const DEGREE_TOPIC_MAP = {
    'information technology': ['networking', 'cybersecurity', 'web development', 'database systems', 'cloud computing'],
    'computer science': ['algorithms', 'artificial intelligence', 'machine learning', 'data structures', 'software engineering'],
    'software engineering': ['software engineering', 'design patterns', 'agile', 'DevOps', 'clean code'],
    'business': ['management', 'accounting', 'economics', 'entrepreneurship', 'marketing'],
    'business administration': ['management', 'accounting', 'business strategy', 'organizational behavior', 'finance'],
    'medicine': ['anatomy', 'pharmacology', 'physiology', 'clinical medicine', 'pathology'],
    'nursing': ['nursing', 'patient care', 'anatomy', 'pharmacology', 'healthcare'],
    'law': ['constitutional law', 'criminal law', 'contract law', 'legal studies', 'jurisprudence'],
    'engineering': ['engineering mathematics', 'mechanics', 'thermodynamics', 'materials science', 'electronics'],
    'electrical engineering': ['circuit theory', 'electronics', 'power systems', 'signal processing', 'electromagnetism'],
    'mechanical engineering': ['thermodynamics', 'fluid mechanics', 'manufacturing', 'machine design', 'materials'],
    'civil engineering': ['structural engineering', 'geotechnical', 'construction', 'fluid mechanics', 'surveying'],
    'mathematics': ['calculus', 'linear algebra', 'statistics', 'probability', 'discrete mathematics'],
    'physics': ['quantum mechanics', 'classical mechanics', 'electrodynamics', 'thermodynamics', 'astrophysics'],
    'chemistry': ['organic chemistry', 'inorganic chemistry', 'biochemistry', 'analytical chemistry', 'physical chemistry'],
    'biology': ['cell biology', 'genetics', 'ecology', 'biochemistry', 'microbiology'],
    'psychology': ['cognitive psychology', 'social psychology', 'behavioral science', 'neuroscience', 'therapy'],
    'economics': ['macroeconomics', 'microeconomics', 'econometrics', 'development economics', 'financial economics'],
    'accounting': ['financial accounting', 'auditing', 'taxation', 'cost accounting', 'corporate finance'],
    'finance': ['corporate finance', 'investment', 'financial markets', 'risk management', 'portfolio management'],
    'architecture': ['architectural design', 'urban planning', 'structural design', 'construction management', 'history of architecture'],
    'education': ['pedagogy', 'curriculum development', 'educational psychology', 'classroom management', 'special education'],
    'sociology': ['social theory', 'research methods', 'cultural studies', 'criminology', 'social inequality'],
    'political science': ['political theory', 'international relations', 'governance', 'public policy', 'comparative politics'],
    'history': ['world history', 'ancient civilizations', 'modern history', 'historiography', 'cultural history'],
    'philosophy': ['ethics', 'logic', 'metaphysics', 'epistemology', 'philosophy of mind'],
};

function mapDegreeToTopics(degree) {
    if (!degree) return ['education'];
    const degLower = degree.toLowerCase();
    
    // Find the best matching key in the map
    for (const [key, topics] of Object.entries(DEGREE_TOPIC_MAP)) {
        if (degLower.includes(key)) {
            return topics;
        }
    }
    // Fallback: generic education
    return ['education', 'textbooks', 'academic writing', 'research methods', 'critical thinking'];
}

    const [suggestions, setSuggestions] = useState([]); // degree-based suggestions, separate from manual search
    const [suggestLoading, setSuggestLoading] = useState(false);
    const [degreeName, setDegreeName] = useState('');

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                setSuggestLoading(true);
                const res = await axios.get('/student/profile');
                const degree = res.data.degree_program || '';
                setDegreeName(degree);

                const topics = mapDegreeToTopics(degree);

                // Fetch up to 3 topics in parallel, 6 books each
                const results = await Promise.all(
                    topics.slice(0, 3).map(topic =>
                        fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(topic)}&has_fulltext=true&limit=6`)
                            .then(r => r.ok ? r.json() : { docs: [] })
                            .then(data => ({
                                topic,
                                books: data.docs
                                    .filter(doc => doc.title && doc.cover_i)
                                    .map(doc => ({
                                        id: doc.key,
                                        title: doc.title,
                                        author: doc.author_name ? doc.author_name.join(', ') : 'Unknown Author',
                                        year: doc.first_publish_year,
                                        coverUrl: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
                                        readUrl: `https://openlibrary.org${doc.key}`,
                                        ia: doc.ia && doc.ia.length > 0 ? doc.ia[0] : null
                                    }))
                            }))
                    )
                );

                // Filter out empty shelves
                setSuggestions(results.filter(r => r.books.length > 0));
            } catch (err) {
                console.error('Could not load suggestions', err);
            } finally {
                setSuggestLoading(false);
            }
        };

        fetchSuggestions();
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        // Clear suggestions when user does a manual search
        setSuggestions([]);
        await performSearch(query, category);
    };

    if (readingBook) {
        return (
            <div className="ebooks-reader-container">
                <div className="ebooks-reader-header">
                    <div>
                        <h2>{readingBook.title}</h2>
                        <p>By {readingBook.author}</p>
                    </div>
                    <button onClick={() => setReadingBook(null)} className="ebooks-reader-close-btn">
                        <i className="bi bi-x-lg"></i> Close Reader
                    </button>
                </div>
                <div className="ebooks-reader-frame-wrapper">
                    <iframe 
                        src={`https://archive.org/stream/${readingBook.ia}?ui=embed`}
                        className="ebooks-reader-frame"
                        frameBorder="0" 
                        allowFullScreen 
                        title={readingBook.title}
                    ></iframe>
                </div>
            </div>
        );
    }

    return (
        <div className="ebooks-container">
            <div className="ebooks-header">
                <h2><i className="bi bi-book-half" style={{ marginRight: '10px', color: '#818cf8' }}></i> Online E-Books Library</h2>
                <p>Search and read thousands of free online e-books.</p>
            </div>

            <div className="ebooks-search-box">
                <form onSubmit={handleSearch} className="ebooks-search-form">
                    <select 
                        className="ebooks-category-select" 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="education">All Educational</option>
                        <option value="textbook">Textbooks</option>
                        <option value="science">Science</option>
                        <option value="mathematics">Mathematics</option>
                        <option value="history">History</option>
                        <option value="computer science">Computer Science</option>
                        <option value="engineering">Engineering</option>
                        <option value="business">Business</option>
                        <option value="medicine">Medicine</option>
                    </select>
                    <input 
                        type="text" 
                        className="ebooks-search-input" 
                        placeholder="Search for books by title, author, or topic..." 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button type="submit" className="ebooks-search-btn" disabled={loading}>
                        {loading ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : <i className="bi bi-search"></i>} Search
                    </button>
                </form>
            </div>

            <div className="ebooks-content">

                {/* Degree-based suggestions */}
                {!hasSearched && (
                    <div className="ebooks-suggestions-section">
                        <h3 className="ebooks-suggestions-title">
                            <i className="bi bi-stars" style={{ color: '#f59e0b', marginRight: '8px' }}></i>
                            Recommended for your Degree{degreeName ? ` – ${degreeName}` : ''}
                        </h3>

                        {suggestLoading && (
                            <div className="ebooks-loading">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p>Loading your personalised recommendations...</p>
                            </div>
                        )}

                        {!suggestLoading && suggestions.map(({ topic, books: shelfBooks }) => (
                            <div key={topic} className="ebooks-shelf">
                                <h4 className="ebooks-shelf-title">
                                    <i className="bi bi-bookmark-fill" style={{ marginRight: '8px', color: '#818cf8' }}></i>
                                    {topic.charAt(0).toUpperCase() + topic.slice(1)}
                                </h4>
                                <div className="ebooks-shelf-grid">
                                    {shelfBooks.map(book => (
                                        <div className="ebook-card" key={book.id}>
                                            <div className="ebook-cover-wrapper">
                                                {book.coverUrl ? (
                                                    <img src={book.coverUrl} alt={book.title} className="ebook-cover" />
                                                ) : (
                                                    <div className="ebook-cover placeholder">
                                                        <i className="bi bi-book"></i>
                                                        <span>No Cover</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ebook-info">
                                                <h3 className="ebook-title" title={book.title}>{book.title}</h3>
                                                <p className="ebook-author">{book.author}</p>
                                                <p className="ebook-year">{book.year || 'Unknown'}</p>
                                                {book.ia ? (
                                                    <button onClick={() => setReadingBook(book)} className="ebook-read-btn">
                                                        Read Now <i className="bi bi-book-half"></i>
                                                    </button>
                                                ) : (
                                                    <a href={book.readUrl} target="_blank" rel="noopener noreferrer" className="ebook-read-btn">
                                                        View Online <i className="bi bi-box-arrow-up-right"></i>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Manual search results */}
                {hasSearched && (
                    <>
                        {loading && (
                            <div className="ebooks-loading">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p>Searching library...</p>
                            </div>
                        )}
                        {!loading && error && (
                            <div className="ebooks-alert error">
                                <i className="bi bi-exclamation-triangle-fill"></i> {error}
                            </div>
                        )}
                        {!loading && !error && books.length === 0 && (
                            <div className="ebooks-alert empty">
                                <i className="bi bi-info-circle-fill"></i> No books found for "{query}". Try different keywords.
                            </div>
                        )}
                        {!loading && !error && books.length > 0 && (
                            <>
                                <h3 className="ebooks-suggestions-title">
                                    <i className="bi bi-search" style={{ color: '#818cf8', marginRight: '8px' }}></i>
                                    Search Results for "{query}"
                                </h3>
                                <div className="ebooks-grid">
                                    {books.map((book) => (
                                        <div className="ebook-card" key={book.id}>
                                            <div className="ebook-cover-wrapper">
                                                {book.coverUrl ? (
                                                    <img src={book.coverUrl} alt={book.title} className="ebook-cover" />
                                                ) : (
                                                    <div className="ebook-cover placeholder">
                                                        <i className="bi bi-book"></i>
                                                        <span>No Cover</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ebook-info">
                                                <h3 className="ebook-title" title={book.title}>{book.title}</h3>
                                                <p className="ebook-author">{book.author}</p>
                                                <p className="ebook-year">First Published: {book.year || 'Unknown'}</p>
                                                {book.ia ? (
                                                    <button onClick={() => setReadingBook(book)} className="ebook-read-btn">
                                                        Read Now <i className="bi bi-book-half"></i>
                                                    </button>
                                                ) : (
                                                    <a href={book.readUrl} target="_blank" rel="noopener noreferrer" className="ebook-read-btn">
                                                        View Online <i className="bi bi-box-arrow-up-right"></i>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default OnlineEbooks;
