--
-- PostgreSQL database dump
--

\restrict M50v9cSXHO8BufCQYv18UhnkJCZc7KwWZuNPLPaD0zYLJyN7rfJKr2y6htUDBBn

-- Dumped from database version 17.8 (a284a84)
-- Dumped by pg_dump version 17.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
    user_id integer,
    action character varying(50) NOT NULL,
    details text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.activity_logs OWNER TO neondb_owner;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_logs_id_seq OWNER TO neondb_owner;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- Name: lecturer_modules; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.lecturer_modules (
    lecturer_id integer NOT NULL,
    module_id integer NOT NULL,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.lecturer_modules OWNER TO neondb_owner;

--
-- Name: module_materials; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.module_materials (
    id integer NOT NULL,
    module_id integer NOT NULL,
    lecturer_id integer NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    week_label character varying(100) NOT NULL,
    file_name character varying(255) NOT NULL,
    file_url character varying(500) NOT NULL,
    file_type character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.module_materials OWNER TO neondb_owner;

--
-- Name: module_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.module_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.module_materials_id_seq OWNER TO neondb_owner;

--
-- Name: module_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.module_materials_id_seq OWNED BY public.module_materials.id;


--
-- Name: modules; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.modules (
    id integer NOT NULL,
    module_code character varying(50) NOT NULL,
    module_name character varying(255) NOT NULL,
    degree_program character varying(200) NOT NULL,
    semester integer NOT NULL,
    studying_year integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.modules OWNER TO neondb_owner;

--
-- Name: modules_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.modules_id_seq OWNER TO neondb_owner;

--
-- Name: modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.modules_id_seq OWNED BY public.modules.id;


--
-- Name: student_applications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.student_applications (
    id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    nic_number character varying(20) NOT NULL,
    phone_number character varying(20),
    address text,
    degree_program character varying(200) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    approved_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT student_applications_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'approved'::character varying, 'rejected'::character varying, 'enrolled'::character varying])::text[])))
);


ALTER TABLE public.student_applications OWNER TO neondb_owner;

--
-- Name: student_applications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.student_applications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.student_applications_id_seq OWNER TO neondb_owner;

--
-- Name: student_applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.student_applications_id_seq OWNED BY public.student_applications.id;


--
-- Name: students; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.students (
    id integer NOT NULL,
    registration_number character varying(30) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    full_name character varying(200) GENERATED ALWAYS AS ((((first_name)::text || ' '::text) || (last_name)::text)) STORED,
    email character varying(255) NOT NULL,
    nic_number character varying(30),
    phone_number character varying(20),
    degree_program character varying(200) NOT NULL,
    studying_year smallint NOT NULL,
    semester smallint NOT NULL,
    address text,
    enrolled_date date DEFAULT CURRENT_DATE,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.students OWNER TO neondb_owner;

--
-- Name: students_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.students_id_seq OWNER TO neondb_owner;

--
-- Name: students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.students_id_seq OWNED BY public.students.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    full_name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    profile_image text,
    is_temp_password boolean DEFAULT false,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['student'::character varying, 'lecturer'::character varying, 'admin_staff'::character varying, 'web_admin'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- Name: module_materials id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.module_materials ALTER COLUMN id SET DEFAULT nextval('public.module_materials_id_seq'::regclass);


--
-- Name: modules id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.modules ALTER COLUMN id SET DEFAULT nextval('public.modules_id_seq'::regclass);


--
-- Name: student_applications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.student_applications ALTER COLUMN id SET DEFAULT nextval('public.student_applications_id_seq'::regclass);


--
-- Name: students id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.students ALTER COLUMN id SET DEFAULT nextval('public.students_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.activity_logs (id, user_id, action, details, created_at) FROM stdin;
1	8	LOGIN	User logged in	2026-03-01 06:56:41.612294
3	8	LOGIN	User logged in	2026-03-01 06:58:33.604821
4	8	LOGIN	User logged in	2026-03-01 07:00:22.312401
7	3	LOGIN	User logged in	2026-03-01 07:05:52.235551
11	8	LOGIN	User logged in	2026-03-01 07:20:48.930571
12	3	LOGIN	User logged in	2026-03-01 07:22:05.710001
14	8	LOGIN	User logged in	2026-03-01 07:28:07.711249
15	3	LOGIN	User logged in	2026-03-01 07:28:35.063197
2	\N	LOGIN	User logged in	2026-03-01 06:57:51.386778
5	\N	LOGIN	User logged in	2026-03-01 07:02:11.22674
8	\N	LOGIN	User logged in	2026-03-01 07:17:30.408338
9	\N	LOGIN	User logged in	2026-03-01 07:18:42.815247
10	\N	LOGIN	User logged in	2026-03-01 07:20:08.500995
16	\N	LOGIN	User logged in	2026-03-01 07:30:41.914693
17	\N	LOGIN	User logged in	2026-03-01 07:30:56.710974
18	\N	LOGIN	User logged in	2026-03-01 07:31:25.989801
32	8	LOGIN	User logged in	2026-03-01 08:13:15.977599
29	\N	LOGIN	User logged in	2026-03-01 08:11:00.731301
30	\N	CHANGE_PASSWORD	User successfully changed their password	2026-03-01 08:11:07.696464
33	8	DELETE_STUDENT	Deleted student record ID 2	2026-03-01 08:19:03.2651
34	8	CREATE_STAFF	Created admin_staff account for hishen.perera@1campus.edu	2026-03-01 08:19:35.659652
37	8	DELETE_STAFF	Deleted admin_staff account (oscar.lee@1campus.edu)	2026-03-01 08:20:53.78285
38	8	DELETE_STAFF	Deleted admin_staff account (nina.patel@1campus.edu)	2026-03-01 08:20:56.843757
6	\N	LOGIN	User logged in	2026-03-01 07:04:04.88537
13	\N	LOGIN	User logged in	2026-03-01 07:24:33.776191
19	\N	LOGIN	User logged in	2026-03-01 07:32:06.165149
20	\N	LOGIN	User logged in	2026-03-01 07:33:12.278303
21	\N	LOGIN	User logged in	2026-03-01 07:45:41.318671
22	\N	REJECT_APPLICATION	Rejected application for amalprasad@gmail.com	2026-03-01 07:46:32.939192
23	\N	LOGIN	User logged in	2026-03-01 07:47:22.00571
24	\N	REJECT_APPLICATION	Rejected application for anna@1campus.edu	2026-03-01 07:54:32.303244
25	\N	REJECT_APPLICATION	Rejected application for testpost125@example.com	2026-03-01 07:54:38.959475
26	\N	LOGIN	User logged in	2026-03-01 08:08:14.446505
27	\N	ACCEPT_APPLICATION	Accepted application for asdad@gmail.com for portal setup	2026-03-01 08:10:17.416263
28	\N	APPROVE_APPLICATION	Created student portal account for asdad@gmail.com (BBA-2026-0001)	2026-03-01 08:10:22.504467
31	\N	DELETE_STUDENT	Deleted student record ID 1	2026-03-01 08:12:54.81255
39	8	DELETE_STAFF	Deleted admin_staff account (mark.davis@1campus.edu)	2026-03-01 08:21:00.808038
42	17	LOGIN	User logged in	2026-03-01 08:23:11.07397
43	17	CHANGE_PASSWORD	User successfully changed their password	2026-03-01 08:23:18.911238
47	3	LOGIN	User logged in	2026-03-01 08:25:37.90055
48	17	LOGIN	User logged in	2026-03-01 10:19:07.142723
53	18	LOGIN	User logged in	2026-03-01 10:50:42.657269
54	18	CHANGE_PASSWORD	User successfully changed their password	2026-03-01 10:50:52.246613
56	8	LOGIN	User logged in	2026-03-01 10:53:49.388684
57	8	CREATE_STAFF	Created admin_staff account for namal.staffadmin@1campus.edu	2026-03-01 10:55:04.1395
63	20	LOGIN	User logged in	2026-03-01 10:58:59.04788
64	20	CHANGE_PASSWORD	User successfully changed their password	2026-03-01 10:59:05.770161
65	8	LOGIN	User logged in	2026-03-01 11:00:18.985658
67	17	LOGIN	User logged in	2026-03-01 11:29:42.143604
68	17	UPDATE_PROFILE_IMAGE	User updated their profile photo	2026-03-01 11:29:51.803231
69	17	LOGIN	User logged in	2026-03-01 11:46:51.237686
71	8	LOGIN	User logged in	2026-03-01 14:22:07.477887
72	3	LOGIN	User logged in	2026-03-01 14:23:19.3072
76	21	LOGIN	User logged in	2026-03-01 14:30:42.799529
77	21	CHANGE_PASSWORD	User successfully changed their password	2026-03-01 14:31:26.000712
81	4	LOGIN	User logged in	2026-03-01 14:35:44.336441
84	4	LOGIN	User logged in	2026-03-01 14:36:29.496437
85	2	LOGIN	User logged in	2026-03-01 17:16:24.367926
86	17	LOGIN	User logged in	2026-03-02 14:57:27.068533
91	17	LOGIN	User logged in	2026-03-02 15:09:13.121425
92	17	LOGIN	User logged in	2026-03-02 16:12:15.875742
93	17	LOGIN	User logged in	2026-03-07 04:01:17.46064
94	2	LOGIN	User logged in	2026-03-19 04:11:34.739252
58	\N	LOGIN	User logged in	2026-03-01 10:55:17.179384
59	\N	CHANGE_PASSWORD	User successfully changed their password	2026-03-01 10:55:25.907518
95	2	LOGIN	User logged in	2026-03-19 04:11:51.497667
96	2	LOGIN	User logged in	2026-03-19 04:11:56.451806
97	17	LOGIN	User logged in	2026-03-19 08:23:29.992283
98	8	LOGIN	User logged in	2026-03-19 08:28:42.189936
35	\N	LOGIN	User logged in	2026-03-01 08:19:56.243408
36	\N	CHANGE_PASSWORD	User successfully changed their password	2026-03-01 08:20:22.298717
40	\N	ACCEPT_APPLICATION	Accepted application for hishenperera@gmail.com for portal setup	2026-03-01 08:22:04.919747
41	\N	APPROVE_APPLICATION	Created student portal account for it260001@1campus.edu (IT260001)	2026-03-01 08:22:27.033654
44	\N	LOGIN	User logged in	2026-03-01 08:24:14.877435
45	\N	CREATE_MODULE	Created module IT101 - INTRODUCTION TO COMPUTING	2026-03-01 08:25:05.331794
46	\N	ASSIGN_MODULE	Assigned module #1 to lecturer Dr. Brian Smith	2026-03-01 08:25:13.820946
49	\N	LOGIN	User logged in	2026-03-01 10:20:02.065036
50	\N	LOGIN	User logged in	2026-03-01 10:27:45.073715
51	\N	ACCEPT_APPLICATION	Accepted application for nimashafernando@gmail.com for portal setup	2026-03-01 10:27:58.505615
52	\N	APPROVE_APPLICATION	Created student portal account for eng260001@1campus.edu (ENG260001)	2026-03-01 10:50:07.131155
55	\N	LOGIN	User logged in	2026-03-01 10:53:27.016751
60	\N	LOGIN	User logged in	2026-03-01 10:56:21.875822
61	\N	ACCEPT_APPLICATION	Accepted application for mohirut@gmail.com for portal setup	2026-03-01 10:57:45.955866
62	\N	APPROVE_APPLICATION	Created student portal account for it260002@1campus.edu (IT260002)	2026-03-01 10:58:31.673715
66	\N	LOGIN	User logged in	2026-03-01 11:22:59.363512
70	\N	LOGIN	User logged in	2026-03-01 14:20:32.169876
73	\N	LOGIN	User logged in	2026-03-01 14:26:45.143699
74	\N	ACCEPT_APPLICATION	Accepted application for hmcpherath927@gmail.com for portal setup	2026-03-01 14:27:12.581747
75	\N	APPROVE_APPLICATION	Created student portal account for ds260001@1campus.edu (DS260001)	2026-03-01 14:27:47.101413
78	\N	LOGIN	User logged in	2026-03-01 14:33:51.501555
79	\N	REMOVE_ASSIGNMENT	Removed lecturer #3 assignment from module #1	2026-03-01 14:34:35.758769
80	\N	ASSIGN_MODULE	Assigned module #1 to lecturer Dr. Clara Williams	2026-03-01 14:34:44.293315
82	\N	LOGIN	User logged in	2026-03-01 14:36:12.859873
83	\N	REMOVE_ASSIGNMENT	Removed lecturer #4 assignment from module #1	2026-03-01 14:36:17.698478
87	\N	LOGIN	User logged in	2026-03-02 15:07:36.80744
88	\N	DELETE_MODULE	Deleted module IT101	2026-03-02 15:07:49.606906
89	\N	CREATE_MODULE	Created module IT101 - Introduction to Computing	2026-03-02 15:08:23.024314
90	\N	CREATE_MODULE	Created module IT102 - Introduction to Programming	2026-03-02 15:08:48.997084
99	8	DELETE_STAFF	Deleted admin_staff account (hishen.perera@1campus.edu)	2026-03-19 08:28:59.366488
100	8	LOGIN	User logged in	2026-03-19 08:46:50.035251
101	17	LOGIN	User logged in	2026-03-19 08:53:42.010745
102	2	LOGIN	User logged in	2026-03-21 05:24:06.642187
103	2	LOGIN	User logged in	2026-03-21 05:24:16.814478
104	2	LOGIN	User logged in	2026-03-21 05:24:38.615004
105	8	LOGIN	User logged in	2026-03-21 05:45:34.74551
106	8	CREATE_STAFF	Created lecturer account for mohiru.t@1campus.edu	2026-03-21 05:46:21.835874
107	22	LOGIN	User logged in	2026-03-21 05:46:44.517313
108	22	CHANGE_PASSWORD	User successfully changed their password	2026-03-21 05:47:00.552534
109	8	LOGIN	User logged in	2026-03-21 05:48:30.038827
110	8	DELETE_STAFF	Deleted admin_staff account (namal.staffadmin@1campus.edu)	2026-03-21 05:48:57.302469
111	8	CREATE_STAFF	Created admin_staff account for charuka.h@1campus.edu	2026-03-21 05:49:22.584525
112	8	LOGIN	User logged in	2026-03-21 05:50:04.19785
113	8	DELETE_STAFF	Deleted admin_staff account (charuka.h@1campus.edu)	2026-03-21 05:50:35.343763
114	8	CREATE_STAFF	Created admin_staff account for charuka.h@1campus.edu	2026-03-21 05:51:04.346237
115	24	LOGIN	User logged in	2026-03-21 05:51:21.162993
116	24	CHANGE_PASSWORD	User successfully changed their password	2026-03-21 05:51:36.826263
117	8	LOGIN	User logged in	2026-03-21 06:00:08.062643
118	8	LOGIN	User logged in	2026-03-21 06:13:18.898786
119	17	LOGIN	User logged in	2026-03-21 06:20:04.030876
120	8	LOGIN	User logged in	2026-03-21 06:22:07.122121
121	22	LOGIN	User logged in	2026-03-21 06:25:04.654805
122	17	LOGIN	User logged in	2026-03-21 06:26:23.333343
123	22	LOGIN	User logged in	2026-03-21 06:44:52.099682
124	24	LOGIN	User logged in	2026-03-21 06:45:13.523863
125	24	ASSIGN_MODULE	Assigned module #2 to lecturer Dr. Mohiru Tushan	2026-03-21 06:45:21.502367
126	24	ASSIGN_MODULE	Assigned module #3 to lecturer Dr. Mohiru Tushan	2026-03-21 06:45:25.093692
127	22	LOGIN	User logged in	2026-03-21 06:45:42.799878
128	17	LOGIN	User logged in	2026-03-21 06:46:52.381333
129	8	LOGIN	User logged in	2026-03-22 13:37:55.943236
130	8	LOGIN	User logged in	2026-03-23 07:39:10.001314
131	8	LOGIN	User logged in	2026-03-23 14:39:38.397928
132	8	LOGIN	User logged in	2026-03-23 15:44:38.0344
133	8	CREATE_STAFF	Created lecturer account for kush@1campus.edu	2026-03-23 15:45:40.482213
134	8	LOGIN	User logged in	2026-03-23 16:29:39.115563
135	8	LOGIN	User logged in	2026-03-23 17:34:17.688495
136	8	LOGIN	User logged in	2026-03-23 17:39:45.558154
137	8	LOGIN	User logged in	2026-03-23 17:49:20.278104
138	8	LOGIN	User logged in	2026-03-23 17:50:31.908052
139	8	LOGIN	User logged in	2026-03-23 17:52:16.267165
140	8	LOGIN	User logged in	2026-03-23 17:53:13.998136
141	8	LOGIN	User logged in	2026-03-23 18:02:28.748186
142	8	LOGIN	User logged in	2026-03-23 18:12:41.06105
\.


--
-- Data for Name: lecturer_modules; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.lecturer_modules (lecturer_id, module_id, assigned_at) FROM stdin;
22	2	2026-03-21 06:45:21.44762
22	3	2026-03-21 06:45:25.042941
\.


--
-- Data for Name: module_materials; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.module_materials (id, module_id, lecturer_id, year, month, week_label, file_name, file_url, file_type, created_at) FROM stdin;
1	2	22	2026	1	January 26 - February 1	02_Network_servers_Baslining__Auditing.pdf	/uploads/materials/mat-1774075595471-867418258.pdf	file	2026-03-21 06:46:35.894254
\.


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.modules (id, module_code, module_name, degree_program, semester, studying_year, created_at) FROM stdin;
2	IT101	Introduction to Computing	Bachelor of Science in Information Technology	1	1	2026-03-02 15:08:22.973409
3	IT102	Introduction to Programming	Bachelor of Science in Information Technology	1	1	2026-03-02 15:08:48.941681
\.


--
-- Data for Name: student_applications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.student_applications (id, first_name, last_name, email, nic_number, phone_number, address, degree_program, status, approved_by, created_at, updated_at) FROM stdin;
1	Amal	Prasad	amalprasad@gmail.com	20013324232	702932103	No,c2	Bachelor of Arts	rejected	\N	2026-03-01 07:32:57.442801	2026-03-01 07:32:57.442801
2	Anna	Joe	anna@1campus.edu	2001243522	790820232	Noasd	Master of Business Administration	rejected	\N	2026-03-01 07:47:10.277235	2026-03-01 07:47:10.277235
3	Jane	Doe	testpost125@example.com	2000188849	+9471112233	123 Test St	Bachelor of Engineering	rejected	\N	2026-03-01 07:51:08.996085	2026-03-01 07:51:08.996085
4	asd	sadas	asdad@gmail.com	23123123	21312312312	ssfasdf	Bachelor of Business Administration	enrolled	\N	2026-03-01 07:56:14.267697	2026-03-01 07:56:14.267697
5	Hishen	Perera	hishenperera@gmail.com	200336110589	0702606776	No.187, Meda Mahawewa, Mahawea	Bachelor of Science in Information Technology	enrolled	\N	2026-03-01 08:21:56.621145	2026-03-01 08:21:56.621145
6	Nimasha	Fernando	nimashafernando@gmail.com	200267893254	0775478756	13/C, High Level Rd, Nugegoda.	Bachelor of Engineering	enrolled	\N	2026-03-01 10:27:09.72101	2026-03-01 10:27:09.72101
7	Mohiru	Tushan	mohirut@gmail.com	200032147620	0712223242	Addr2	Bachelor of Science in Information Technology	enrolled	\N	2026-03-01 10:57:34.170409	2026-03-01 10:57:34.170409
8	Charuka	Prabasha	hmcpherath927@gmail.com	200227101240	0773121506	Chilaw	Bachelor of Science in Data Science	enrolled	\N	2026-03-01 14:26:18.015072	2026-03-01 14:26:18.015072
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.students (id, registration_number, first_name, last_name, email, nic_number, phone_number, degree_program, studying_year, semester, address, enrolled_date, status, created_at) FROM stdin;
4	ENG260001	Nimasha	Fernando	eng260001@1campus.edu	200267893254	0775478756	Bachelor of Engineering	1	1	13/C, High Level Rd, Nugegoda.	2026-03-01	active	2026-03-01 10:50:07.131155+00
5	IT260002	Mohiru	Tushan	it260002@1campus.edu	200032147620	0712223242	Bachelor of Science in Information Technology	1	1	Addr2	2026-03-01	active	2026-03-01 10:58:31.673715+00
3	IT260001	Hishen	Perera	it260001@1campus.edu	200336110589	0702606776	Bachelor of Science in Information Technology	1	1	No.187, Meda Mahawewa, Mahawewa	2026-03-01	active	2026-03-01 08:22:27.033654+00
6	DS260001	Charuka	Prabasha	ds260001@1campus.edu	200227101240	0773121506	Bachelor of Science in Data Science	1	1	Chilaw	2026-03-01	active	2026-03-01 14:27:47.101413+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, full_name, email, password, role, created_at, profile_image, is_temp_password) FROM stdin;
2	Dr. Alice Johnson	alice.johnson@1campus.edu	$2b$10$bf9lwV9ier9Q2PVrSnOeRO0z9OWz/JdhiDrWfRK.1mHerFqq46uE2	lecturer	2026-03-01 02:51:15.033658	\N	f
3	Dr. Brian Smith	brian.smith@1campus.edu	$2b$10$7L4V/Xv2G4A05YuM2pGfbendEtldqpFqwPi4cHZfiBF0XjdwK1fCW	lecturer	2026-03-01 02:51:15.242423	\N	f
4	Dr. Clara Williams	clara.williams@1campus.edu	$2b$10$7zE5rJT9uh4y3EQUx7dNxOiMGDrcXSQfVUNipldHaPizhVCi8Tdk6	lecturer	2026-03-01 02:51:15.46052	\N	f
8	Sara Chen	sara.chen@1campus.edu	$2b$10$pV20HKSHEt13H2CVVNYtWusCcJt.OdN/Sa5df5.JuXilLAzr81j4a	web_admin	2026-03-01 02:51:16.360785	\N	f
9	Tom Rivera	tom.rivera@1campus.edu	$2b$10$Cysh1xtztgQmxSUnIf03N.NBkTHOIZdRDOWx1y4lDeIWfMvWTBjJy	web_admin	2026-03-01 02:51:16.57859	\N	f
10	Uma Sharma	uma.sharma@1campus.edu	$2b$10$OoUlO2vFSj/X01msnzOO1uPQlgYocZDVE7l9A1borJAp1NdAaK856	web_admin	2026-03-01 02:51:16.812899	\N	f
1	Test Student	student@campus.edu	$2b$10$O/mYQa4YKnGYvZY1H8IJqOViTW/onvkOVX0ROm16m5LVeRsVtQz8G	student	2026-02-25 17:09:36.410825	uploads/avatar-1772339215864-904493677.jpeg	f
12	Hishen Perera	hishen@1campus.edu	$2b$10$/G96M.5SB5GE6ZIcmDrHV.JOr8uUXJSczi/qNARjKvcsQRoxe7OMG	student	2026-03-01 04:45:23.476307	\N	f
18	Nimasha Fernando	eng260001@1campus.edu	$2b$10$5lbvkYOQX3ZvQmjgc4IbK.3S4UkyXYnq4GCJQs5jwa0k5HRz4Wb1u	student	2026-03-01 10:50:07.131155	\N	f
20	Mohiru Tushan	it260002@1campus.edu	$2b$10$Jpn9FIgaLTwZ1TpDrrKvc.crgNIdR8p5RFRI1MpVoC4f/Hf8fWrMy	student	2026-03-01 10:58:31.673715	\N	f
17	Hishen Perera	it260001@1campus.edu	$2b$10$/fa8Gxd3zdW63jgiXGAWXu0BZeQXMZMAUc7WYC/llGdw.6nazGxoO	student	2026-03-01 08:22:27.033654	uploads/avatar-1772364591605-181895009.jpeg	f
21	Charuka Prabasha	ds260001@1campus.edu	$2b$10$cQeoMue4/gtyJaHO8NRqv.V/RdGBHpDW8wEbYpgUJ9ZAv9G1xgldC	student	2026-03-01 14:27:47.101413	\N	f
22	Dr. Mohiru Tushan	mohiru.t@1campus.edu	$2b$10$6lKcQI2eH4kvpm8d0pkTceXu0Ce1lF.lTcB480sWXotp9Y5rKhPEe	lecturer	2026-03-21 05:46:21.657754	\N	f
24	Charuka Herath	charuka.h@1campus.edu	$2b$10$pGsCG1f1KknltaHmt6h...XcIn0LBQXN7n09XGKBhSBxLcRryIyYC	admin_staff	2026-03-21 05:51:04.251626	\N	f
25	Kush Jayakody	kush@1campus.edu	$2b$10$cOFpwttb0A4EPxEgCvmWKubavDJ3601P65ZG77mn.VfT.9yyrW70K	lecturer	2026-03-23 15:45:40.342559	\N	t
\.


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 142, true);


--
-- Name: module_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.module_materials_id_seq', 1, true);


--
-- Name: modules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.modules_id_seq', 3, true);


--
-- Name: student_applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.student_applications_id_seq', 8, true);


--
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.students_id_seq', 6, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 25, true);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: lecturer_modules lecturer_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lecturer_modules
    ADD CONSTRAINT lecturer_modules_pkey PRIMARY KEY (lecturer_id, module_id);


--
-- Name: module_materials module_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.module_materials
    ADD CONSTRAINT module_materials_pkey PRIMARY KEY (id);


--
-- Name: modules modules_module_code_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_module_code_key UNIQUE (module_code);


--
-- Name: modules modules_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.modules
    ADD CONSTRAINT modules_pkey PRIMARY KEY (id);


--
-- Name: student_applications student_applications_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.student_applications
    ADD CONSTRAINT student_applications_email_key UNIQUE (email);


--
-- Name: student_applications student_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.student_applications
    ADD CONSTRAINT student_applications_pkey PRIMARY KEY (id);


--
-- Name: students students_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_email_key UNIQUE (email);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: students students_registration_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_registration_number_key UNIQUE (registration_number);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: lecturer_modules lecturer_modules_lecturer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lecturer_modules
    ADD CONSTRAINT lecturer_modules_lecturer_id_fkey FOREIGN KEY (lecturer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: lecturer_modules lecturer_modules_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lecturer_modules
    ADD CONSTRAINT lecturer_modules_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: module_materials module_materials_lecturer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.module_materials
    ADD CONSTRAINT module_materials_lecturer_id_fkey FOREIGN KEY (lecturer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: module_materials module_materials_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.module_materials
    ADD CONSTRAINT module_materials_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: student_applications student_applications_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.student_applications
    ADD CONSTRAINT student_applications_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict M50v9cSXHO8BufCQYv18UhnkJCZc7KwWZuNPLPaD0zYLJyN7rfJKr2y6htUDBBn

