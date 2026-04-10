--
-- PostgreSQL database dump
--

\restrict DDjdZawLcNzDHAqGujw9OR2BDVX07U5pwqoCfh5rRdB8n9Xz6S87Fe2g01OmC9Z

-- Dumped from database version 17.8 (a48d9ca)
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
-- Name: messages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    sender_id integer NOT NULL,
    receiver_id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    is_read boolean DEFAULT false
);


ALTER TABLE public.messages OWNER TO neondb_owner;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO neondb_owner;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


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
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    intake character varying(10)
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
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    intake character varying(10)
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
-- Name: quiz_questions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.quiz_questions (
    id integer NOT NULL,
    quiz_id integer NOT NULL,
    question_text text NOT NULL,
    options jsonb NOT NULL,
    correct_option_index integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.quiz_questions OWNER TO neondb_owner;

--
-- Name: quiz_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.quiz_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quiz_questions_id_seq OWNER TO neondb_owner;

--
-- Name: quiz_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.quiz_questions_id_seq OWNED BY public.quiz_questions.id;


--
-- Name: quiz_submissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.quiz_submissions (
    id integer NOT NULL,
    quiz_id integer NOT NULL,
    student_id integer NOT NULL,
    score integer,
    total_questions integer,
    answers jsonb,
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.quiz_submissions OWNER TO neondb_owner;

--
-- Name: quiz_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.quiz_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quiz_submissions_id_seq OWNER TO neondb_owner;

--
-- Name: quiz_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.quiz_submissions_id_seq OWNED BY public.quiz_submissions.id;


--
-- Name: quizzes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.quizzes (
    id integer NOT NULL,
    module_id integer NOT NULL,
    lecturer_id integer NOT NULL,
    title character varying(255) NOT NULL,
    topic character varying(255) NOT NULL,
    difficulty character varying(50) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    timer_minutes integer DEFAULT 0
);


ALTER TABLE public.quizzes OWNER TO neondb_owner;

--
-- Name: quizzes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.quizzes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quizzes_id_seq OWNER TO neondb_owner;

--
-- Name: quizzes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.quizzes_id_seq OWNED BY public.quizzes.id;


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
    intake character varying(10),
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
    created_at timestamp with time zone DEFAULT now(),
    intake character varying(10)
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
-- Name: tickets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tickets (
    id integer NOT NULL,
    student_id integer NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'Pending'::character varying,
    admin_comment text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tickets OWNER TO neondb_owner;

--
-- Name: tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tickets_id_seq OWNER TO neondb_owner;

--
-- Name: tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tickets_id_seq OWNED BY public.tickets.id;


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
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: module_materials id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.module_materials ALTER COLUMN id SET DEFAULT nextval('public.module_materials_id_seq'::regclass);


--
-- Name: modules id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.modules ALTER COLUMN id SET DEFAULT nextval('public.modules_id_seq'::regclass);


--
-- Name: quiz_questions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quiz_questions ALTER COLUMN id SET DEFAULT nextval('public.quiz_questions_id_seq'::regclass);


--
-- Name: quiz_submissions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quiz_submissions ALTER COLUMN id SET DEFAULT nextval('public.quiz_submissions_id_seq'::regclass);


--
-- Name: quizzes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quizzes ALTER COLUMN id SET DEFAULT nextval('public.quizzes_id_seq'::regclass);


--
-- Name: student_applications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.student_applications ALTER COLUMN id SET DEFAULT nextval('public.student_applications_id_seq'::regclass);


--
-- Name: students id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.students ALTER COLUMN id SET DEFAULT nextval('public.students_id_seq'::regclass);


--
-- Name: tickets id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tickets ALTER COLUMN id SET DEFAULT nextval('public.tickets_id_seq'::regclass);


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
11	8	LOGIN	User logged in	2026-03-01 07:20:48.930571
14	8	LOGIN	User logged in	2026-03-01 07:28:07.711249
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
53	18	LOGIN	User logged in	2026-03-01 10:50:42.657269
54	18	CHANGE_PASSWORD	User successfully changed their password	2026-03-01 10:50:52.246613
56	8	LOGIN	User logged in	2026-03-01 10:53:49.388684
57	8	CREATE_STAFF	Created admin_staff account for namal.staffadmin@1campus.edu	2026-03-01 10:55:04.1395
63	20	LOGIN	User logged in	2026-03-01 10:58:59.04788
64	20	CHANGE_PASSWORD	User successfully changed their password	2026-03-01 10:59:05.770161
65	8	LOGIN	User logged in	2026-03-01 11:00:18.985658
71	8	LOGIN	User logged in	2026-03-01 14:22:07.477887
76	21	LOGIN	User logged in	2026-03-01 14:30:42.799529
77	21	CHANGE_PASSWORD	User successfully changed their password	2026-03-01 14:31:26.000712
58	\N	LOGIN	User logged in	2026-03-01 10:55:17.179384
59	\N	CHANGE_PASSWORD	User successfully changed their password	2026-03-01 10:55:25.907518
85	\N	LOGIN	User logged in	2026-03-01 17:16:24.367926
94	\N	LOGIN	User logged in	2026-03-19 04:11:34.739252
7	\N	LOGIN	User logged in	2026-03-01 07:05:52.235551
12	\N	LOGIN	User logged in	2026-03-01 07:22:05.710001
15	\N	LOGIN	User logged in	2026-03-01 07:28:35.063197
47	\N	LOGIN	User logged in	2026-03-01 08:25:37.90055
72	\N	LOGIN	User logged in	2026-03-01 14:23:19.3072
81	\N	LOGIN	User logged in	2026-03-01 14:35:44.336441
84	\N	LOGIN	User logged in	2026-03-01 14:36:29.496437
42	\N	LOGIN	User logged in	2026-03-01 08:23:11.07397
43	\N	CHANGE_PASSWORD	User successfully changed their password	2026-03-01 08:23:18.911238
48	\N	LOGIN	User logged in	2026-03-01 10:19:07.142723
67	\N	LOGIN	User logged in	2026-03-01 11:29:42.143604
68	\N	UPDATE_PROFILE_IMAGE	User updated their profile photo	2026-03-01 11:29:51.803231
69	\N	LOGIN	User logged in	2026-03-01 11:46:51.237686
86	\N	LOGIN	User logged in	2026-03-02 14:57:27.068533
91	\N	LOGIN	User logged in	2026-03-02 15:09:13.121425
92	\N	LOGIN	User logged in	2026-03-02 16:12:15.875742
93	\N	LOGIN	User logged in	2026-03-07 04:01:17.46064
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
120	8	LOGIN	User logged in	2026-03-21 06:22:07.122121
121	22	LOGIN	User logged in	2026-03-21 06:25:04.654805
123	22	LOGIN	User logged in	2026-03-21 06:44:52.099682
124	24	LOGIN	User logged in	2026-03-21 06:45:13.523863
125	24	ASSIGN_MODULE	Assigned module #2 to lecturer Dr. Mohiru Tushan	2026-03-21 06:45:21.502367
126	24	ASSIGN_MODULE	Assigned module #3 to lecturer Dr. Mohiru Tushan	2026-03-21 06:45:25.093692
127	22	LOGIN	User logged in	2026-03-21 06:45:42.799878
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
143	8	LOGIN	User logged in	2026-03-24 04:39:32.628075
144	8	LOGIN	User logged in	2026-03-24 06:44:10.291554
145	8	LOGIN	User logged in	2026-03-25 03:15:37.127946
147	24	LOGIN	User logged in	2026-03-25 10:20:58.960704
149	24	LOGIN	User logged in	2026-03-25 10:34:11.408712
151	22	LOGIN	User logged in	2026-03-25 10:37:11.821736
152	24	LOGIN	User logged in	2026-03-25 10:38:02.700462
153	24	LOGIN	User logged in	2026-03-25 10:39:43.64986
154	24	ACCEPT_APPLICATION	Accepted application for tharuka@test.lk for portal setup	2026-03-25 10:39:49.17625
155	24	APPROVE_APPLICATION	Created student portal account for ds260002@1campus.edu (DS260002)	2026-03-25 10:40:09.13995
156	26	LOGIN	User logged in	2026-03-25 10:40:39.246844
157	26	CHANGE_PASSWORD	User successfully changed their password	2026-03-25 10:40:56.04213
158	24	LOGIN	User logged in	2026-03-25 10:41:34.453325
159	24	CREATE_MODULE	Created module DS101-Jul - Introduction to Data & Information (Jul-Dec)	2026-03-25 10:48:50.592944
160	24	ASSIGN_MODULE	Assigned module #4 to lecturer Dr. Mohiru Tushan	2026-03-25 10:49:00.436294
161	24	DELETE_MODULE	Deleted module IT101	2026-03-25 10:49:07.356671
97	\N	LOGIN	User logged in	2026-03-19 08:23:29.992283
101	\N	LOGIN	User logged in	2026-03-19 08:53:42.010745
119	\N	LOGIN	User logged in	2026-03-21 06:20:04.030876
122	\N	LOGIN	User logged in	2026-03-21 06:26:23.333343
128	\N	LOGIN	User logged in	2026-03-21 06:46:52.381333
162	24	DELETE_MODULE	Deleted module IT102	2026-03-25 10:49:09.220856
163	22	LOGIN	User logged in	2026-03-25 10:49:33.530232
164	26	LOGIN	User logged in	2026-03-25 10:50:26.686911
165	22	LOGIN	User logged in	2026-03-25 10:51:15.39584
166	24	LOGIN	User logged in	2026-03-25 11:03:04.370506
167	24	REJECT_APPLICATION	Rejected application for john.doe.intake@example.com	2026-03-25 11:03:40.537142
168	22	LOGIN	User logged in	2026-03-25 11:41:44.106727
169	24	LOGIN	User logged in	2026-03-25 11:42:05.110255
170	24	ASSIGN_MODULE	Assigned module #21 to lecturer Dr. Mohiru Tushan	2026-03-25 11:42:27.263953
171	24	ASSIGN_MODULE	Assigned module #22 to lecturer Dr. Mohiru Tushan	2026-03-25 11:42:32.694835
172	24	ASSIGN_MODULE	Assigned module #23 to lecturer Dr. Mohiru Tushan	2026-03-25 11:42:37.882837
173	24	ASSIGN_MODULE	Assigned module #24 to lecturer Dr. Mohiru Tushan	2026-03-25 11:42:43.437435
174	24	ASSIGN_MODULE	Assigned module #69 to lecturer Dr. Mohiru Tushan	2026-03-25 11:42:59.087661
175	24	ASSIGN_MODULE	Assigned module #70 to lecturer Dr. Mohiru Tushan	2026-03-25 11:43:03.075206
176	24	ASSIGN_MODULE	Assigned module #71 to lecturer Dr. Mohiru Tushan	2026-03-25 11:43:13.248292
177	24	ASSIGN_MODULE	Assigned module #72 to lecturer Dr. Mohiru Tushan	2026-03-25 11:43:17.876847
178	22	LOGIN	User logged in	2026-03-25 11:43:51.957941
179	8	LOGIN	User logged in	2026-03-25 11:54:13.540681
180	8	DELETE_STAFF	Deleted lecturer account (kush@1campus.edu)	2026-03-25 11:54:26.496876
95	\N	LOGIN	User logged in	2026-03-19 04:11:51.497667
96	\N	LOGIN	User logged in	2026-03-19 04:11:56.451806
102	\N	LOGIN	User logged in	2026-03-21 05:24:06.642187
103	\N	LOGIN	User logged in	2026-03-21 05:24:16.814478
104	\N	LOGIN	User logged in	2026-03-21 05:24:38.615004
181	8	DELETE_STAFF	Deleted lecturer account (alice.johnson@1campus.edu)	2026-03-25 11:54:36.046698
182	8	DELETE_STAFF	Deleted lecturer account (brian.smith@1campus.edu)	2026-03-25 11:54:38.046696
183	8	DELETE_STAFF	Deleted lecturer account (clara.williams@1campus.edu)	2026-03-25 11:54:40.186858
184	22	LOGIN	User logged in	2026-03-25 11:55:09.362579
185	22	LOGIN	User logged in	2026-03-25 12:00:10.223502
186	8	LOGIN	User logged in	2026-03-26 01:13:33.221141
188	8	LOGIN	User logged in	2026-03-26 01:19:50.766794
189	24	LOGIN	User logged in	2026-03-26 01:20:13.101059
190	22	LOGIN	User logged in	2026-03-26 09:34:35.08279
191	22	LOGIN	User logged in	2026-03-26 09:35:47.524718
192	24	LOGIN	User logged in	2026-03-26 09:36:16.268661
193	24	LOGIN	User logged in	2026-03-26 09:36:29.46609
194	24	LOGIN	User logged in	2026-03-26 09:36:35.845496
195	22	LOGIN	User logged in	2026-03-26 09:37:09.204152
196	22	LOGIN	User logged in	2026-03-26 13:28:49.225498
197	24	LOGIN	User logged in	2026-03-26 13:31:01.500929
198	24	LOGIN	User logged in	2026-03-26 15:54:09.293578
199	24	ACCEPT_APPLICATION	Accepted application for mohirutest@gmail.com for portal setup	2026-03-26 15:54:30.720997
200	24	APPROVE_APPLICATION	Created student portal account for cs260001@1campus.edu (CS260001)	2026-03-26 15:54:45.688663
203	8	LOGIN	User logged in	2026-03-26 15:56:13.181587
204	8	CREATE_WEB_ADMIN	Created web_admin account for kushmi.j@1campus.edu	2026-03-26 15:57:50.299323
205	8	DELETE_WEB_ADMIN	Deleted web_admin account (tom.rivera@1campus.edu)	2026-03-26 16:00:11.892173
206	8	DELETE_WEB_ADMIN	Deleted web_admin account (uma.sharma@1campus.edu)	2026-03-26 16:00:14.916703
207	22	LOGIN	User logged in	2026-03-26 16:01:40.276726
208	24	LOGIN	User logged in	2026-03-26 16:02:09.769835
209	24	LOGIN	User logged in	2026-03-26 16:04:20.969143
210	24	ACCEPT_APPLICATION	Accepted application for test@gmail.com for portal setup	2026-03-26 16:04:33.464188
211	24	APPROVE_APPLICATION	Created student portal account for ba260001@1campus.edu (BA260001)	2026-03-26 16:04:41.860208
212	24	ASSIGN_MODULE	Assigned module #5 to lecturer Dr. Mohiru Tushan	2026-03-26 16:07:28.373778
213	22	LOGIN	User logged in	2026-03-26 16:07:46.081104
215	24	LOGIN	User logged in	2026-03-26 16:12:22.289511
216	24	DELETE_STUDENT	Deleted student record ID 649	2026-03-26 16:13:01.662378
217	8	LOGIN	User logged in	2026-03-26 16:15:03.86892
218	22	LOGIN	User logged in	2026-03-26 16:32:18.839535
219	8	LOGIN	User logged in	2026-03-26 16:39:34.911941
220	22	LOGIN	User logged in	2026-03-26 16:46:22.920557
221	22	LOGIN	User logged in	2026-03-26 16:49:48.156222
222	22	LOGIN	User logged in	2026-03-26 16:49:56.760325
223	22	LOGIN	User logged in	2026-03-26 16:57:41.823917
224	22	LOGIN	User logged in	2026-03-26 16:57:56.510808
225	22	LOGIN	User logged in	2026-03-26 16:58:59.40394
226	22	LOGIN	User logged in	2026-03-26 17:06:15.834354
227	22	LOGIN	User logged in	2026-03-26 17:06:21.717765
228	22	LOGIN	User logged in	2026-03-26 17:12:16.370307
229	22	LOGIN	User logged in	2026-03-26 17:13:09.647855
230	22	LOGIN	User logged in	2026-03-26 17:15:30.059174
231	22	LOGIN	User logged in	2026-03-26 17:15:38.323785
232	22	LOGIN	User logged in	2026-03-26 17:22:56.198353
233	22	LOGIN	User logged in	2026-03-26 17:23:59.446097
234	22	LOGIN	User logged in	2026-03-26 17:29:11.695562
235	22	LOGIN	User logged in	2026-03-26 17:32:31.015764
236	22	LOGIN	User logged in	2026-03-26 17:39:38.529268
237	22	LOGIN	User logged in	2026-03-26 17:46:11.364837
238	22	LOGIN	User logged in	2026-03-26 17:49:22.80649
239	22	LOGIN	User logged in	2026-03-26 17:57:11.079225
240	24	LOGIN	User logged in	2026-03-26 18:13:21.763999
241	22	LOGIN	User logged in	2026-03-26 18:15:06.144127
242	24	LOGIN	User logged in	2026-03-26 18:20:16.464085
243	22	LOGIN	User logged in	2026-03-26 18:20:43.858737
244	22	LOGIN	User logged in	2026-03-26 18:25:59.938929
245	22	LOGIN	User logged in	2026-03-27 01:54:09.329005
246	22	LOGIN	User logged in	2026-03-27 02:02:18.804274
247	24	LOGIN	User logged in	2026-03-27 02:02:47.284271
248	24	LOGIN	User logged in	2026-03-27 07:37:33.02584
249	24	LOGIN	User logged in	2026-03-27 07:53:09.525546
250	24	LOGIN	User logged in	2026-03-27 11:12:03.22448
251	22	LOGIN	User logged in	2026-03-27 11:30:44.422192
252	24	LOGIN	User logged in	2026-03-27 13:10:31.398493
253	22	LOGIN	User logged in	2026-03-27 13:11:20.998632
254	22	LOGIN	User logged in	2026-03-27 13:58:17.446204
255	22	LOGIN	User logged in	2026-03-27 14:03:47.833888
256	22	LOGIN	User logged in	2026-03-27 14:05:57.916312
257	24	LOGIN	User logged in	2026-03-27 14:14:48.542481
258	22	LOGIN	User logged in	2026-03-27 14:28:32.409723
259	22	LOGIN	User logged in	2026-03-27 14:38:46.090532
260	22	LOGIN	User logged in	2026-03-27 14:39:28.561628
187	\N	LOGIN	User logged in	2026-03-26 01:18:06.360091
214	\N	LOGIN	User logged in	2026-03-26 16:11:06.371438
261	22	LOGIN	User logged in	2026-03-27 14:39:31.526591
262	24	LOGIN	User logged in	2026-03-27 14:46:29.808021
263	22	LOGIN	User logged in	2026-03-27 14:48:56.749063
264	22	LOGIN	User logged in	2026-03-27 14:58:33.993026
265	8	LOGIN	User logged in	2026-03-27 15:14:10.498778
266	8	DELETE_WEB_ADMIN	Deleted web_admin account (kushmi.j@1campus.edu)	2026-03-27 15:14:55.150641
267	8	CREATE_WEB_ADMIN	Created web_admin account for kushmi.j@1campus.edu	2026-03-27 15:15:19.732319
268	670	LOGIN	User logged in	2026-03-27 15:15:27.756824
269	670	CHANGE_PASSWORD	User successfully changed their password	2026-03-27 15:15:35.626147
272	670	LOGIN	User logged in	2026-03-27 15:29:40.239695
274	670	LOGIN	User logged in	2026-03-27 15:34:21.253567
276	22	LOGIN	User logged in	2026-03-27 15:49:24.711578
278	26	LOGIN	User logged in	2026-03-27 15:53:14.573639
279	670	LOGIN	User logged in	2026-03-27 15:54:00.553664
280	670	LOGIN	User logged in	2026-03-27 15:57:23.333799
281	670	LOGIN	User logged in	2026-03-27 15:58:09.998706
282	22	LOGIN	User logged in	2026-03-27 16:04:20.165186
283	24	LOGIN	User logged in	2026-03-27 16:04:59.870475
284	22	LOGIN	User logged in	2026-03-27 16:05:25.497721
286	22	LOGIN	User logged in	2026-03-27 16:19:48.941036
287	22	LOGIN	User logged in	2026-03-27 23:49:38.454781
288	24	LOGIN	User logged in	2026-03-28 01:35:59.448784
289	22	LOGIN	User logged in	2026-03-28 02:00:17.406979
290	670	LOGIN	User logged in	2026-03-28 02:41:01.273559
291	22	LOGIN	User logged in	2026-03-28 03:41:35.115325
292	24	LOGIN	User logged in	2026-03-28 03:45:50.228601
293	26	LOGIN	User logged in	2026-03-28 03:57:43.917805
294	22	LOGIN	User logged in	2026-03-28 04:00:21.996665
295	670	LOGIN	User logged in	2026-03-28 04:06:31.814273
296	24	LOGIN	User logged in	2026-03-28 04:08:07.812287
201	\N	LOGIN	User logged in	2026-03-26 15:55:39.062818
202	\N	CHANGE_PASSWORD	User successfully changed their password	2026-03-26 15:55:48.256946
297	24	DELETE_STUDENT	Deleted student record ID 648	2026-03-28 04:09:42.67112
298	22	LOGIN	User logged in	2026-03-28 04:17:28.791991
299	670	LOGIN	User logged in	2026-03-28 04:33:12.044118
300	22	LOGIN	User logged in	2026-03-28 04:34:31.862035
301	24	LOGIN	User logged in	2026-03-30 13:12:16.903374
302	22	LOGIN	User logged in	2026-04-05 06:56:51.822171
303	22	LOGIN	User logged in	2026-04-05 06:57:07.444306
304	22	LOGIN	User logged in	2026-04-09 07:19:21.664242
306	24	LOGIN	User logged in	2026-04-09 09:42:52.645379
308	24	LOGIN	User logged in	2026-04-09 09:44:12.188431
311	22	LOGIN	User logged in	2026-04-09 10:17:15.719964
313	22	LOGIN	User logged in	2026-04-09 10:22:48.180519
315	22	LOGIN	User logged in	2026-04-09 10:26:43.48112
316	670	LOGIN	User logged in	2026-04-09 10:27:30.778607
317	22	LOGIN	User logged in	2026-04-09 10:28:17.780959
319	22	LOGIN	User logged in	2026-04-09 10:30:46.569067
321	22	LOGIN	User logged in	2026-04-09 10:34:00.208099
323	22	LOGIN	User logged in	2026-04-09 10:36:17.319851
325	22	LOGIN	User logged in	2026-04-09 10:54:57.296522
327	24	LOGIN	User logged in	2026-04-09 14:36:06.304004
328	24	LOGIN	User logged in	2026-04-09 16:10:29.861965
329	24	ACCEPT_APPLICATION	Accepted application for it23163218@my.sliit.lk for portal setup	2026-04-09 16:10:37.821051
330	24	APPROVE_APPLICATION	Created student portal account for cs260001@1campus.edu (CS260001)	2026-04-09 16:10:51.850957
331	24	DELETE_STUDENT	Deleted student record ID 650	2026-04-09 16:11:31.520313
332	24	LOGIN	User logged in	2026-04-09 16:17:04.733655
333	24	ACCEPT_APPLICATION	Accepted application for tharuwijerathna350@gmail.com for portal setup	2026-04-09 16:17:08.581254
334	24	APPROVE_APPLICATION	Created student portal account for cs260001@1campus.edu (CS260001)	2026-04-09 16:17:11.853895
335	24	DELETE_STUDENT	Deleted student record ID 651	2026-04-09 16:19:20.761145
336	24	LOGIN	User logged in	2026-04-09 16:20:34.20139
337	24	ACCEPT_APPLICATION	Accepted application for hishenportofolio@gmail.com for portal setup	2026-04-09 16:20:37.002333
338	24	APPROVE_APPLICATION	Created student portal account for cs260001@1campus.edu (CS260001)	2026-04-09 16:20:40.985041
339	670	LOGIN	User logged in	2026-04-09 16:29:31.278767
340	670	DB_DELETE_ROW	Deleted row id=15 from table student_applications	2026-04-09 16:31:42.749456
341	670	DB_DELETE_ROW	Deleted row id=14 from table student_applications	2026-04-09 16:33:30.425951
342	670	DB_DELETE_ROW	Deleted row id=6 from table students	2026-04-09 16:34:42.227252
343	670	DB_DELETE_ROW	Deleted row id=3 from table students	2026-04-09 16:34:52.755503
344	670	DB_DELETE_ROW	Deleted row id=652 from table students	2026-04-09 16:35:04.94745
345	670	DB_DELETE_ROW	Deleted row id=5 from table students	2026-04-09 16:35:11.162388
346	670	DB_DELETE_ROW	Deleted row id=4 from table students	2026-04-09 16:35:15.385344
347	670	DB_DELETE_ROW	Deleted row id=5 from table student_applications	2026-04-09 16:35:30.747304
349	24	LOGIN	User logged in	2026-04-09 16:38:51.024497
350	670	LOGIN	User logged in	2026-04-09 16:39:12.962393
146	\N	LOGIN	User logged in	2026-03-25 10:14:34.637195
148	\N	LOGIN	User logged in	2026-03-25 10:33:28.913301
150	\N	LOGIN	User logged in	2026-03-25 10:35:46.044905
270	\N	LOGIN	User logged in	2026-03-27 15:16:38.506518
271	\N	LOGIN	User logged in	2026-03-27 15:21:08.810258
273	\N	LOGIN	User logged in	2026-03-27 15:30:51.791292
275	\N	LOGIN	User logged in	2026-03-27 15:38:40.982825
277	\N	LOGIN	User logged in	2026-03-27 15:50:04.953248
285	\N	LOGIN	User logged in	2026-03-27 16:09:35.958209
305	\N	LOGIN	User logged in	2026-04-09 09:36:15.4179
307	\N	LOGIN	User logged in	2026-04-09 09:43:45.281372
309	\N	LOGIN	User logged in	2026-04-09 09:52:07.965705
310	\N	LOGIN	User logged in	2026-04-09 10:16:51.289343
312	\N	LOGIN	User logged in	2026-04-09 10:18:04.890367
314	\N	LOGIN	User logged in	2026-04-09 10:25:51.299775
318	\N	LOGIN	User logged in	2026-04-09 10:29:38.685176
320	\N	LOGIN	User logged in	2026-04-09 10:31:40.392717
322	\N	LOGIN	User logged in	2026-04-09 10:35:04.013087
324	\N	LOGIN	User logged in	2026-04-09 10:38:21.02
326	\N	LOGIN	User logged in	2026-04-09 14:33:59.073916
348	\N	LOGIN	User logged in	2026-04-09 16:38:10.610155
351	670	DB_DELETE_ROW	Deleted row id=17 from table users	2026-04-09 16:39:35.445405
352	670	DB_DELETE_ROW	Deleted row id=1 from table users	2026-04-09 16:39:53.330551
353	24	LOGIN	User logged in	2026-04-09 16:52:07.229407
354	24	ACCEPT_APPLICATION	Accepted application for hishenperera@gmail.com for portal setup	2026-04-09 16:52:12.454541
355	24	APPROVE_APPLICATION	Created student portal account for it260001@1campus.edu (IT260001)	2026-04-09 16:52:19.45782
356	670	LOGIN	User logged in	2026-04-09 16:56:13.769546
357	670	DB_DELETE_ROW	Deleted row id=674 from table users	2026-04-09 16:56:27.358742
358	670	DB_DELETE_ROW	Deleted row id=673 from table users	2026-04-09 16:56:32.585006
359	670	DB_DELETE_ROW	Deleted row id=653 from table students	2026-04-09 16:56:38.918314
360	670	LOGIN	User logged in	2026-04-09 16:57:16.695117
361	670	DB_DELETE_ROW	Deleted row id=16 from table student_applications	2026-04-09 16:57:26.793056
362	24	LOGIN	User logged in	2026-04-09 16:58:09.909706
363	24	ACCEPT_APPLICATION	Accepted application for hishenperera@gmail.com for portal setup	2026-04-09 16:58:13.276227
364	24	APPROVE_APPLICATION	Created student portal account for it260001@1campus.edu (IT260001)	2026-04-09 16:58:18.931987
365	675	LOGIN	User logged in	2026-04-09 16:59:04.572001
366	675	CHANGE_PASSWORD	User successfully changed their password	2026-04-09 16:59:14.172168
367	24	LOGIN	User logged in	2026-04-09 17:06:46.672988
368	24	ACCEPT_APPLICATION	Accepted application for tharuwijerathna350@gmail.com for portal setup	2026-04-09 17:06:49.301523
369	24	APPROVE_APPLICATION	Created student portal account for mcs260001@1campus.edu (MCS260001)	2026-04-09 17:06:52.736304
370	670	LOGIN	User logged in	2026-04-09 17:11:17.071619
371	670	DB_DELETE_ROW	Deleted row id=655 from table students	2026-04-09 17:11:31.012215
372	670	DB_DELETE_ROW	Deleted row id=676 from table users	2026-04-09 17:11:41.792938
373	670	LOGIN	User logged in	2026-04-09 17:12:42.412471
374	670	DB_DELETE_ROW	Deleted row id=18 from table student_applications	2026-04-09 17:12:48.918532
375	24	LOGIN	User logged in	2026-04-09 17:13:21.373514
376	24	ACCEPT_APPLICATION	Accepted application for tharuwijerathna350@gmail.com for portal setup	2026-04-09 17:13:23.910408
377	24	APPROVE_APPLICATION	Created student portal account for mcs260001@1campus.edu (MCS260001)	2026-04-09 17:13:28.536077
378	24	LOGIN	User logged in	2026-04-09 17:16:50.118388
379	24	ACCEPT_APPLICATION	Accepted application for dewwijerathna2001@gmail.com for portal setup	2026-04-09 17:16:53.278351
380	24	APPROVE_APPLICATION	Created student portal account for mcs260002@1campus.edu (MCS260002)	2026-04-09 17:16:56.290618
381	670	LOGIN	User logged in	2026-04-09 17:20:28.62924
382	670	LOGIN	User logged in	2026-04-10 04:45:15.040794
\.


--
-- Data for Name: lecturer_modules; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.lecturer_modules (lecturer_id, module_id, assigned_at) FROM stdin;
22	21	2026-03-25 11:42:27.205795
22	22	2026-03-25 11:42:32.645933
22	23	2026-03-25 11:42:37.825936
22	24	2026-03-25 11:42:43.381468
22	69	2026-03-25 11:42:59.038752
22	70	2026-03-25 11:43:03.018204
22	71	2026-03-25 11:43:13.192332
22	72	2026-03-25 11:43:17.819013
22	5	2026-03-26 16:07:28.31548
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.messages (id, sender_id, receiver_id, content, created_at, is_read) FROM stdin;
\.


--
-- Data for Name: module_materials; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.module_materials (id, module_id, lecturer_id, year, month, week_label, file_name, file_url, file_type, created_at, intake) FROM stdin;
\.


--
-- Data for Name: modules; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.modules (id, module_code, module_name, degree_program, semester, studying_year, created_at, intake) FROM stdin;
5	CS101-Jan	Programming Fundamentals (1.1)	Bachelor of Science in Computer Science	1	1	2026-03-25 11:02:44.273095	Jan-Jun
6	CS101-Jul	Programming Fundamentals (1.1)	Bachelor of Science in Computer Science	1	1	2026-03-25 11:02:44.273095	Jul-Dec
7	CS102-Jan	Data Structures (1.2)	Bachelor of Science in Computer Science	2	1	2026-03-25 11:02:44.273095	Jan-Jun
8	CS102-Jul	Data Structures (1.2)	Bachelor of Science in Computer Science	2	1	2026-03-25 11:02:44.273095	Jul-Dec
9	CS201-Jan	Algorithms (2.1)	Bachelor of Science in Computer Science	1	2	2026-03-25 11:02:44.273095	Jan-Jun
10	CS201-Jul	Algorithms (2.1)	Bachelor of Science in Computer Science	1	2	2026-03-25 11:02:44.273095	Jul-Dec
11	CS202-Jan	Operating Systems (2.2)	Bachelor of Science in Computer Science	2	2	2026-03-25 11:02:44.273095	Jan-Jun
12	CS202-Jul	Operating Systems (2.2)	Bachelor of Science in Computer Science	2	2	2026-03-25 11:02:44.273095	Jul-Dec
13	CS301-Jan	Databases (3.1)	Bachelor of Science in Computer Science	1	3	2026-03-25 11:02:44.273095	Jan-Jun
14	CS301-Jul	Databases (3.1)	Bachelor of Science in Computer Science	1	3	2026-03-25 11:02:44.273095	Jul-Dec
15	CS302-Jan	Networks (3.2)	Bachelor of Science in Computer Science	2	3	2026-03-25 11:02:44.273095	Jan-Jun
16	CS302-Jul	Networks (3.2)	Bachelor of Science in Computer Science	2	3	2026-03-25 11:02:44.273095	Jul-Dec
17	CS401-Jan	AI (4.1)	Bachelor of Science in Computer Science	1	4	2026-03-25 11:02:44.273095	Jan-Jun
18	CS401-Jul	AI (4.1)	Bachelor of Science in Computer Science	1	4	2026-03-25 11:02:44.273095	Jul-Dec
19	CS402-Jan	Machine Learning (4.2)	Bachelor of Science in Computer Science	2	4	2026-03-25 11:02:44.273095	Jan-Jun
20	CS402-Jul	Machine Learning (4.2)	Bachelor of Science in Computer Science	2	4	2026-03-25 11:02:44.273095	Jul-Dec
21	IT101-Jan	IT Fundamentals (1.1)	Bachelor of Science in Information Technology	1	1	2026-03-25 11:02:44.273095	Jan-Jun
22	IT101-Jul	IT Fundamentals (1.1)	Bachelor of Science in Information Technology	1	1	2026-03-25 11:02:44.273095	Jul-Dec
23	IT102-Jan	Web Development (1.2)	Bachelor of Science in Information Technology	2	1	2026-03-25 11:02:44.273095	Jan-Jun
24	IT102-Jul	Web Development (1.2)	Bachelor of Science in Information Technology	2	1	2026-03-25 11:02:44.273095	Jul-Dec
25	IT201-Jan	Systems Analysis (2.1)	Bachelor of Science in Information Technology	1	2	2026-03-25 11:02:44.273095	Jan-Jun
26	IT201-Jul	Systems Analysis (2.1)	Bachelor of Science in Information Technology	1	2	2026-03-25 11:02:44.273095	Jul-Dec
27	IT202-Jan	IT Project Management (2.2)	Bachelor of Science in Information Technology	2	2	2026-03-25 11:02:44.273095	Jan-Jun
28	IT202-Jul	IT Project Management (2.2)	Bachelor of Science in Information Technology	2	2	2026-03-25 11:02:44.273095	Jul-Dec
29	IT301-Jan	Cloud Computing (3.1)	Bachelor of Science in Information Technology	1	3	2026-03-25 11:02:44.273095	Jan-Jun
30	IT301-Jul	Cloud Computing (3.1)	Bachelor of Science in Information Technology	1	3	2026-03-25 11:02:44.273095	Jul-Dec
31	IT302-Jan	Cybersecurity (3.2)	Bachelor of Science in Information Technology	2	3	2026-03-25 11:02:44.273095	Jan-Jun
32	IT302-Jul	Cybersecurity (3.2)	Bachelor of Science in Information Technology	2	3	2026-03-25 11:02:44.273095	Jul-Dec
33	IT401-Jan	Enterprise Systems (4.1)	Bachelor of Science in Information Technology	1	4	2026-03-25 11:02:44.273095	Jan-Jun
34	IT401-Jul	Enterprise Systems (4.1)	Bachelor of Science in Information Technology	1	4	2026-03-25 11:02:44.273095	Jul-Dec
35	IT402-Jan	E-commerce (4.2)	Bachelor of Science in Information Technology	2	4	2026-03-25 11:02:44.273095	Jan-Jun
36	IT402-Jul	E-commerce (4.2)	Bachelor of Science in Information Technology	2	4	2026-03-25 11:02:44.273095	Jul-Dec
37	ENG101-Jan	Engineering Math (1.1)	Bachelor of Engineering	1	1	2026-03-25 11:02:44.273095	Jan-Jun
38	ENG101-Jul	Engineering Math (1.1)	Bachelor of Engineering	1	1	2026-03-25 11:02:44.273095	Jul-Dec
39	ENG102-Jan	Physics for Engineers (1.2)	Bachelor of Engineering	2	1	2026-03-25 11:02:44.273095	Jan-Jun
40	ENG102-Jul	Physics for Engineers (1.2)	Bachelor of Engineering	2	1	2026-03-25 11:02:44.273095	Jul-Dec
41	ENG201-Jan	Statics (2.1)	Bachelor of Engineering	1	2	2026-03-25 11:02:44.273095	Jan-Jun
42	ENG201-Jul	Statics (2.1)	Bachelor of Engineering	1	2	2026-03-25 11:02:44.273095	Jul-Dec
43	ENG202-Jan	Dynamics (2.2)	Bachelor of Engineering	2	2	2026-03-25 11:02:44.273095	Jan-Jun
44	ENG202-Jul	Dynamics (2.2)	Bachelor of Engineering	2	2	2026-03-25 11:02:44.273095	Jul-Dec
45	ENG301-Jan	Thermodynamics (3.1)	Bachelor of Engineering	1	3	2026-03-25 11:02:44.273095	Jan-Jun
46	ENG301-Jul	Thermodynamics (3.1)	Bachelor of Engineering	1	3	2026-03-25 11:02:44.273095	Jul-Dec
47	ENG302-Jan	Materials Science (3.2)	Bachelor of Engineering	2	3	2026-03-25 11:02:44.273095	Jan-Jun
48	ENG302-Jul	Materials Science (3.2)	Bachelor of Engineering	2	3	2026-03-25 11:02:44.273095	Jul-Dec
49	ENG401-Jan	Control Systems (4.1)	Bachelor of Engineering	1	4	2026-03-25 11:02:44.273095	Jan-Jun
50	ENG401-Jul	Control Systems (4.1)	Bachelor of Engineering	1	4	2026-03-25 11:02:44.273095	Jul-Dec
51	ENG402-Jan	Engineering Design (4.2)	Bachelor of Engineering	2	4	2026-03-25 11:02:44.273095	Jan-Jun
52	ENG402-Jul	Engineering Design (4.2)	Bachelor of Engineering	2	4	2026-03-25 11:02:44.273095	Jul-Dec
53	BUS101-Jan	Principles of Management (1.1)	Bachelor of Business Administration	1	1	2026-03-25 11:02:44.273095	Jan-Jun
54	BUS101-Jul	Principles of Management (1.1)	Bachelor of Business Administration	1	1	2026-03-25 11:02:44.273095	Jul-Dec
55	BUS102-Jan	Accounting (1.2)	Bachelor of Business Administration	2	1	2026-03-25 11:02:44.273095	Jan-Jun
56	BUS102-Jul	Accounting (1.2)	Bachelor of Business Administration	2	1	2026-03-25 11:02:44.273095	Jul-Dec
57	BUS201-Jan	Marketing (2.1)	Bachelor of Business Administration	1	2	2026-03-25 11:02:44.273095	Jan-Jun
58	BUS201-Jul	Marketing (2.1)	Bachelor of Business Administration	1	2	2026-03-25 11:02:44.273095	Jul-Dec
59	BUS202-Jan	Finance (2.2)	Bachelor of Business Administration	2	2	2026-03-25 11:02:44.273095	Jan-Jun
60	BUS202-Jul	Finance (2.2)	Bachelor of Business Administration	2	2	2026-03-25 11:02:44.273095	Jul-Dec
61	BUS301-Jan	Business Ethics (3.1)	Bachelor of Business Administration	1	3	2026-03-25 11:02:44.273095	Jan-Jun
62	BUS301-Jul	Business Ethics (3.1)	Bachelor of Business Administration	1	3	2026-03-25 11:02:44.273095	Jul-Dec
63	BUS302-Jan	Operations Mgmt (3.2)	Bachelor of Business Administration	2	3	2026-03-25 11:02:44.273095	Jan-Jun
64	BUS302-Jul	Operations Mgmt (3.2)	Bachelor of Business Administration	2	3	2026-03-25 11:02:44.273095	Jul-Dec
65	BUS401-Jan	Strategic Mgmt (4.1)	Bachelor of Business Administration	1	4	2026-03-25 11:02:44.273095	Jan-Jun
66	BUS401-Jul	Strategic Mgmt (4.1)	Bachelor of Business Administration	1	4	2026-03-25 11:02:44.273095	Jul-Dec
67	BUS402-Jan	Global Business (4.2)	Bachelor of Business Administration	2	4	2026-03-25 11:02:44.273095	Jan-Jun
68	BUS402-Jul	Global Business (4.2)	Bachelor of Business Administration	2	4	2026-03-25 11:02:44.273095	Jul-Dec
69	DS101-Jan	Intro to Data Science (1.1)	Bachelor of Science in Data Science	1	1	2026-03-25 11:02:44.273095	Jan-Jun
70	DS101-Jul	Intro to Data Science (1.1)	Bachelor of Science in Data Science	1	1	2026-03-25 11:02:44.273095	Jul-Dec
71	DS102-Jan	Statistics (1.2)	Bachelor of Science in Data Science	2	1	2026-03-25 11:02:44.273095	Jan-Jun
72	DS102-Jul	Statistics (1.2)	Bachelor of Science in Data Science	2	1	2026-03-25 11:02:44.273095	Jul-Dec
73	DS201-Jan	Data Wrangling (2.1)	Bachelor of Science in Data Science	1	2	2026-03-25 11:02:44.273095	Jan-Jun
74	DS201-Jul	Data Wrangling (2.1)	Bachelor of Science in Data Science	1	2	2026-03-25 11:02:44.273095	Jul-Dec
75	DS202-Jan	Data Visualization (2.2)	Bachelor of Science in Data Science	2	2	2026-03-25 11:02:44.273095	Jan-Jun
76	DS202-Jul	Data Visualization (2.2)	Bachelor of Science in Data Science	2	2	2026-03-25 11:02:44.273095	Jul-Dec
77	DS301-Jan	Big Data (3.1)	Bachelor of Science in Data Science	1	3	2026-03-25 11:02:44.273095	Jan-Jun
78	DS301-Jul	Big Data (3.1)	Bachelor of Science in Data Science	1	3	2026-03-25 11:02:44.273095	Jul-Dec
79	DS302-Jan	Predictive Modeling (3.2)	Bachelor of Science in Data Science	2	3	2026-03-25 11:02:44.273095	Jan-Jun
80	DS302-Jul	Predictive Modeling (3.2)	Bachelor of Science in Data Science	2	3	2026-03-25 11:02:44.273095	Jul-Dec
81	DS401-Jan	Deep Learning (4.1)	Bachelor of Science in Data Science	1	4	2026-03-25 11:02:44.273095	Jan-Jun
82	DS401-Jul	Deep Learning (4.1)	Bachelor of Science in Data Science	1	4	2026-03-25 11:02:44.273095	Jul-Dec
83	DS402-Jan	Data Ethics (4.2)	Bachelor of Science in Data Science	2	4	2026-03-25 11:02:44.273095	Jan-Jun
84	DS402-Jul	Data Ethics (4.2)	Bachelor of Science in Data Science	2	4	2026-03-25 11:02:44.273095	Jul-Dec
85	ART101-Jan	Intro to Humanities (1.1)	Bachelor of Arts	1	1	2026-03-25 11:02:44.273095	Jan-Jun
86	ART101-Jul	Intro to Humanities (1.1)	Bachelor of Arts	1	1	2026-03-25 11:02:44.273095	Jul-Dec
87	ART102-Jan	History (1.2)	Bachelor of Arts	2	1	2026-03-25 11:02:44.273095	Jan-Jun
88	ART102-Jul	History (1.2)	Bachelor of Arts	2	1	2026-03-25 11:02:44.273095	Jul-Dec
89	ART201-Jan	Literature (2.1)	Bachelor of Arts	1	2	2026-03-25 11:02:44.273095	Jan-Jun
90	ART201-Jul	Literature (2.1)	Bachelor of Arts	1	2	2026-03-25 11:02:44.273095	Jul-Dec
91	ART202-Jan	Sociology (2.2)	Bachelor of Arts	2	2	2026-03-25 11:02:44.273095	Jan-Jun
92	ART202-Jul	Sociology (2.2)	Bachelor of Arts	2	2	2026-03-25 11:02:44.273095	Jul-Dec
93	ART301-Jan	Psychology (3.1)	Bachelor of Arts	1	3	2026-03-25 11:02:44.273095	Jan-Jun
94	ART301-Jul	Psychology (3.1)	Bachelor of Arts	1	3	2026-03-25 11:02:44.273095	Jul-Dec
95	ART302-Jan	Philosophy (3.2)	Bachelor of Arts	2	3	2026-03-25 11:02:44.273095	Jan-Jun
96	ART302-Jul	Philosophy (3.2)	Bachelor of Arts	2	3	2026-03-25 11:02:44.273095	Jul-Dec
97	ART401-Jan	Political Science (4.1)	Bachelor of Arts	1	4	2026-03-25 11:02:44.273095	Jan-Jun
98	ART401-Jul	Political Science (4.1)	Bachelor of Arts	1	4	2026-03-25 11:02:44.273095	Jul-Dec
99	ART402-Jan	Contemporary Arts (4.2)	Bachelor of Arts	2	4	2026-03-25 11:02:44.273095	Jan-Jun
100	ART402-Jul	Contemporary Arts (4.2)	Bachelor of Arts	2	4	2026-03-25 11:02:44.273095	Jul-Dec
101	MCS101-Jan	Advanced Programming (1.1)	Master of Science in Computer Science	1	1	2026-03-25 11:02:44.273095	Jan-Jun
102	MCS101-Jul	Advanced Programming (1.1)	Master of Science in Computer Science	1	1	2026-03-25 11:02:44.273095	Jul-Dec
103	MCS102-Jan	Advanced Data Structures (1.2)	Master of Science in Computer Science	2	1	2026-03-25 11:02:44.273095	Jan-Jun
104	MCS102-Jul	Advanced Data Structures (1.2)	Master of Science in Computer Science	2	1	2026-03-25 11:02:44.273095	Jul-Dec
105	MCS201-Jan	Distributed Systems (2.1)	Master of Science in Computer Science	1	2	2026-03-25 11:02:44.273095	Jan-Jun
106	MCS201-Jul	Distributed Systems (2.1)	Master of Science in Computer Science	1	2	2026-03-25 11:02:44.273095	Jul-Dec
107	MCS202-Jan	Advanced AI (2.2)	Master of Science in Computer Science	2	2	2026-03-25 11:02:44.273095	Jan-Jun
108	MCS202-Jul	Advanced AI (2.2)	Master of Science in Computer Science	2	2	2026-03-25 11:02:44.273095	Jul-Dec
109	MCS301-Jan	Advanced OS (3.1)	Master of Science in Computer Science	1	3	2026-03-25 11:02:44.273095	Jan-Jun
110	MCS301-Jul	Advanced OS (3.1)	Master of Science in Computer Science	1	3	2026-03-25 11:02:44.273095	Jul-Dec
111	MCS302-Jan	Research Methods (3.2)	Master of Science in Computer Science	2	3	2026-03-25 11:02:44.273095	Jan-Jun
112	MCS302-Jul	Research Methods (3.2)	Master of Science in Computer Science	2	3	2026-03-25 11:02:44.273095	Jul-Dec
113	MCS401-Jan	Thesis I (4.1)	Master of Science in Computer Science	1	4	2026-03-25 11:02:44.273095	Jan-Jun
114	MCS401-Jul	Thesis I (4.1)	Master of Science in Computer Science	1	4	2026-03-25 11:02:44.273095	Jul-Dec
115	MCS402-Jan	Thesis II (4.2)	Master of Science in Computer Science	2	4	2026-03-25 11:02:44.273095	Jan-Jun
116	MCS402-Jul	Thesis II (4.2)	Master of Science in Computer Science	2	4	2026-03-25 11:02:44.273095	Jul-Dec
117	MBUS101-Jan	Managerial Economics (1.1)	Master of Business Administration	1	1	2026-03-25 11:02:44.273095	Jan-Jun
118	MBUS101-Jul	Managerial Economics (1.1)	Master of Business Administration	1	1	2026-03-25 11:02:44.273095	Jul-Dec
119	MBUS102-Jan	Organizational Behavior (1.2)	Master of Business Administration	2	1	2026-03-25 11:02:44.273095	Jan-Jun
120	MBUS102-Jul	Organizational Behavior (1.2)	Master of Business Administration	2	1	2026-03-25 11:02:44.273095	Jul-Dec
121	MBUS201-Jan	Corporate Finance (2.1)	Master of Business Administration	1	2	2026-03-25 11:02:44.273095	Jan-Jun
122	MBUS201-Jul	Corporate Finance (2.1)	Master of Business Administration	1	2	2026-03-25 11:02:44.273095	Jul-Dec
123	MBUS202-Jan	Marketing Strategy (2.2)	Master of Business Administration	2	2	2026-03-25 11:02:44.273095	Jan-Jun
124	MBUS202-Jul	Marketing Strategy (2.2)	Master of Business Administration	2	2	2026-03-25 11:02:44.273095	Jul-Dec
125	MBUS301-Jan	Leadership (3.1)	Master of Business Administration	1	3	2026-03-25 11:02:44.273095	Jan-Jun
126	MBUS301-Jul	Leadership (3.1)	Master of Business Administration	1	3	2026-03-25 11:02:44.273095	Jul-Dec
127	MBUS302-Jan	Supply Chain (3.2)	Master of Business Administration	2	3	2026-03-25 11:02:44.273095	Jan-Jun
128	MBUS302-Jul	Supply Chain (3.2)	Master of Business Administration	2	3	2026-03-25 11:02:44.273095	Jul-Dec
129	MBUS401-Jan	Business Analytics (4.1)	Master of Business Administration	1	4	2026-03-25 11:02:44.273095	Jan-Jun
130	MBUS401-Jul	Business Analytics (4.1)	Master of Business Administration	1	4	2026-03-25 11:02:44.273095	Jul-Dec
131	MBUS402-Jan	Capstone (4.2)	Master of Business Administration	2	4	2026-03-25 11:02:44.273095	Jan-Jun
132	MBUS402-Jul	Capstone (4.2)	Master of Business Administration	2	4	2026-03-25 11:02:44.273095	Jul-Dec
\.


--
-- Data for Name: quiz_questions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.quiz_questions (id, quiz_id, question_text, options, correct_option_index, created_at) FROM stdin;
31	4	Which generation of computers used vacuum tubes?	["First Generation", "Second Generation", "Third Generation", "Fourth Generation"]	0	2026-04-09 10:34:30.546761
32	4	What was the primary characteristic of second-generation computers?	["Use of vacuum tubes", "Use of transistors", "Use of integrated circuits", "Use of microprocessors"]	1	2026-04-09 10:34:30.546761
33	4	Which generation of computers introduced the microprocessor?	["Second Generation", "Third Generation", "Fourth Generation", "Fifth Generation"]	2	2026-04-09 10:34:30.546761
34	4	What is a key feature of fourth-generation computers?	["Use of vacuum tubes", "Use of transistors", "Use of microprocessors", "Use of artificial intelligence"]	2	2026-04-09 10:34:30.546761
35	4	Which of the following is a characteristic of fifth-generation computers?	["Use of vacuum tubes", "Use of transistors", "Use of integrated circuits", "Use of artificial intelligence"]	3	2026-04-09 10:34:30.546761
36	4	What is the time period for the development of first-generation computers?	["1940s-1950s", "1950s-1960s", "1960s-1970s", "1970s-1980s"]	0	2026-04-09 10:34:30.546761
37	4	Which generation of computers saw the introduction of commercial computers?	["First Generation", "Second Generation", "Third Generation", "Fourth Generation"]	1	2026-04-09 10:34:30.546761
38	4	What was the main advantage of third-generation computers over second-generation computers?	["Faster processing speed", "Increased storage capacity", "Improved reliability", "All of the above"]	3	2026-04-09 10:34:30.546761
39	4	Which of the following is NOT a characteristic of fourth-generation computers?	["Use of microprocessors", "Increased storage capacity", "Improved reliability", "Use of vacuum tubes"]	3	2026-04-09 10:34:30.546761
40	4	What is the current generation of computers?	["Fourth Generation", "Fifth Generation", "Sixth Generation", "Seventh Generation"]	1	2026-04-09 10:34:30.546761
41	5	What is the base of the binary number system?	["8", "10", "12", "2"]	3	2026-04-09 10:34:51.135927
42	5	Which number system is commonly used in computer programming?	["Decimal", "Binary", "Hexadecimal", "All of the above"]	3	2026-04-09 10:34:51.135927
43	5	What is the largest digit in the hexadecimal number system?	["9", "A", "F", "G"]	2	2026-04-09 10:34:51.135927
44	5	What is the decimal equivalent of the binary number 1010?	["8", "10", "12", "14"]	1	2026-04-09 10:34:51.135927
45	5	Which number system uses powers of 16 to represent numbers?	["Binary", "Decimal", "Hexadecimal", "Octal"]	2	2026-04-09 10:34:51.135927
46	5	What is the binary equivalent of the decimal number 12?	["1100", "1101", "1110", "1111"]	0	2026-04-09 10:34:51.135927
47	5	What is the purpose of the radix point in a number system?	["To separate the whole part from the fractional part", "To separate the numerator from the denominator", "To indicate the sign of the number", "To indicate the base of the number system"]	0	2026-04-09 10:34:51.135927
48	5	Which of the following is a valid hexadecimal digit?	["G", "H", "I", "F"]	3	2026-04-09 10:34:51.135927
49	5	What is the decimal equivalent of the hexadecimal number A2?	["128", "130", "132", "162"]	3	2026-04-09 10:34:51.135927
50	5	What is the binary equivalent of the hexadecimal number F?	["1110", "1111", "1000", "1010"]	1	2026-04-09 10:34:51.135927
\.


--
-- Data for Name: quiz_submissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.quiz_submissions (id, quiz_id, student_id, score, total_questions, answers, submitted_at) FROM stdin;
\.


--
-- Data for Name: quizzes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.quizzes (id, module_id, lecturer_id, title, topic, difficulty, description, created_at, timer_minutes) FROM stdin;
4	21	22	Generations of Computers Quiz	Generations of a computer	Easy	\N	2026-04-09 10:34:30.546761	0
5	21	22	Number Systems Quiz	Number Systems	Easy	\N	2026-04-09 10:34:51.135927	10
\.


--
-- Data for Name: student_applications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.student_applications (id, first_name, last_name, email, nic_number, phone_number, address, degree_program, status, approved_by, created_at, updated_at, intake) FROM stdin;
20	Tharuka	Wijerathna	dewwijerathna2001@gmail.com	200177102816	0753748807	No.187,\nMeda Mahawewa,	Master of Science in Computer Science	enrolled	24	2026-04-09 17:16:41.194258	2026-04-09 17:16:41.194258	Jul-Dec
11	Mohiru	Tushan	mohirutest@gmail.com	991992243V	0716771697	Senanayake Rd, Rabukkana.	Bachelor of Science in Computer Science	enrolled	24	2026-03-26 15:53:47.705298	2026-03-26 15:53:47.705298	Jul-Dec
12	Test	Test	test@gmail.com	2000000000	0702606776	Test	Bachelor of Arts	enrolled	24	2026-03-26 16:03:48.891094	2026-03-26 16:03:48.891094	Jan-Jun
1	Amal	Prasad	amalprasad@gmail.com	20013324232	702932103	No,c2	Bachelor of Arts	rejected	\N	2026-03-01 07:32:57.442801	2026-03-01 07:32:57.442801	\N
13	Hishen	Perera	it23163218@my.sliit.lk	200227101240	+94 702606776	No.187,\nMeda Mahawewa,	Bachelor of Science in Computer Science	enrolled	24	2026-04-09 16:10:15.811421	2026-04-09 16:10:15.811421	Jan-Jun
2	Anna	Joe	anna@1campus.edu	2001243522	790820232	Noasd	Master of Business Administration	rejected	\N	2026-03-01 07:47:10.277235	2026-03-01 07:47:10.277235	\N
3	Jane	Doe	testpost125@example.com	2000188849	+9471112233	123 Test St	Bachelor of Engineering	rejected	\N	2026-03-01 07:51:08.996085	2026-03-01 07:51:08.996085	\N
4	asd	sadas	asdad@gmail.com	23123123	21312312312	ssfasdf	Bachelor of Business Administration	enrolled	\N	2026-03-01 07:56:14.267697	2026-03-01 07:56:14.267697	\N
17	Hishen	Perera	hishenperera@gmail.com	200336110589	0702606776	No.187,\nMeda Mahawewa,	Bachelor of Science in Information Technology	enrolled	24	2026-04-09 16:57:41.45733	2026-04-09 16:57:41.45733	Jul-Dec
6	Nimasha	Fernando	nimashafernando@gmail.com	200267893254	0775478756	13/C, High Level Rd, Nugegoda.	Bachelor of Engineering	enrolled	\N	2026-03-01 10:27:09.72101	2026-03-01 10:27:09.72101	\N
7	Mohiru	Tushan	mohirut@gmail.com	200032147620	0712223242	Addr2	Bachelor of Science in Information Technology	enrolled	\N	2026-03-01 10:57:34.170409	2026-03-01 10:57:34.170409	\N
8	Charuka	Prabasha	hmcpherath927@gmail.com	200227101240	0773121506	Chilaw	Bachelor of Science in Data Science	enrolled	\N	2026-03-01 14:26:18.015072	2026-03-01 14:26:18.015072	\N
10	Tharuka	Fernando	tharuka@test.lk	200227101240	0773121506	Test	Bachelor of Science in Data Science	enrolled	24	2026-03-25 10:39:33.045358	2026-03-25 10:39:33.045358	Jul-Dec
9	John	Doe	john.doe.intake@example.com	123456789V	+94771234567	123 Main St	Bachelor of Science in Computer Science	rejected	\N	2026-03-25 10:38:09.999363	2026-03-25 10:38:09.999363	Jan-Jun
19	Tharuka	Wijerathna	tharuwijerathna350@gmail.com	200177102816	0753748807	No.187,\nMeda Mahawewa,	Master of Science in Computer Science	enrolled	24	2026-04-09 17:13:12.535374	2026-04-09 17:13:12.535374	Jul-Dec
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.students (id, registration_number, first_name, last_name, email, nic_number, phone_number, degree_program, studying_year, semester, address, enrolled_date, status, created_at, intake) FROM stdin;
7	DS260002	Tharuka	Fernando	ds260002@1campus.edu	200227101240	0773121506	Bachelor of Science in Data Science	1	1	Test	2026-03-25	active	2026-03-25 10:40:09.13995+00	Jul-Dec
654	IT260001	Hishen	Perera	it260001@1campus.edu	200336110589	0702606776	Bachelor of Science in Information Technology	1	1	No.187,\nMeda Mahawewa,	2026-04-09	active	2026-04-09 16:58:18.931987+00	Jul-Dec
656	MCS260001	Tharuka	Wijerathna	mcs260001@1campus.edu	200177102816	0753748807	Master of Science in Computer Science	1	1	No.187,\nMeda Mahawewa,	2026-04-09	active	2026-04-09 17:13:28.536077+00	Jul-Dec
657	MCS260002	Tharuka	Wijerathna	mcs260002@1campus.edu	200177102816	0753748807	Master of Science in Computer Science	1	1	No.187,\nMeda Mahawewa,	2026-04-09	active	2026-04-09 17:16:56.290618+00	Jul-Dec
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tickets (id, student_id, type, title, description, status, admin_comment, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, full_name, email, password, role, created_at, profile_image, is_temp_password) FROM stdin;
8	Sara Chen	sara.chen@1campus.edu	$2b$10$pV20HKSHEt13H2CVVNYtWusCcJt.OdN/Sa5df5.JuXilLAzr81j4a	web_admin	2026-03-01 02:51:16.360785	\N	f
12	Hishen Perera	hishen@1campus.edu	$2b$10$/G96M.5SB5GE6ZIcmDrHV.JOr8uUXJSczi/qNARjKvcsQRoxe7OMG	student	2026-03-01 04:45:23.476307	\N	f
26	Tharuka Fernando	ds260002@1campus.edu	$2b$10$jn2fIkBdLu5/14CWXrqbiOCa4/mJOY4C2/1oWcqECL378I7PuIqGa	student	2026-03-25 10:40:09.13995	\N	f
670	Kushmi Jayakody	kushmi.j@1campus.edu	$2b$10$LcqCysL6d.p393.rsJXfNuIW5vQ75q.PhsKaFPebsxaYP.aX1GTmC	web_admin	2026-03-27 15:15:19.614301	\N	f
675	Hishen Perera	it260001@1campus.edu	$2b$10$6hbeOXQiBOyvs3hNDAmV3.nycn7CHnJi5c4wP/hwVRhthH/WlkP0e	student	2026-04-09 16:58:18.931987	\N	f
18	Nimasha Fernando	eng260001@1campus.edu	$2b$10$5lbvkYOQX3ZvQmjgc4IbK.3S4UkyXYnq4GCJQs5jwa0k5HRz4Wb1u	student	2026-03-01 10:50:07.131155	\N	f
677	Tharuka Wijerathna	mcs260001@1campus.edu	$2b$10$8TVF18HcGZmzWp5CM95.iecnjJBAbecV6p9cxbhV8JU33UuJvmLuC	student	2026-04-09 17:13:28.536077	\N	t
678	Tharuka Wijerathna	mcs260002@1campus.edu	$2b$10$hRwZtpBFWUrX8kvul9zX9ujYXisj9Nb78o6M/lo0g49vLrcwt/ktG	student	2026-04-09 17:16:56.290618	\N	t
20	Mohiru Tushan	it260002@1campus.edu	$2b$10$Jpn9FIgaLTwZ1TpDrrKvc.crgNIdR8p5RFRI1MpVoC4f/Hf8fWrMy	student	2026-03-01 10:58:31.673715	\N	f
21	Charuka Prabasha	ds260001@1campus.edu	$2b$10$cQeoMue4/gtyJaHO8NRqv.V/RdGBHpDW8wEbYpgUJ9ZAv9G1xgldC	student	2026-03-01 14:27:47.101413	\N	f
22	Dr. Mohiru Tushan	mohiru.t@1campus.edu	$2b$10$6lKcQI2eH4kvpm8d0pkTceXu0Ce1lF.lTcB480sWXotp9Y5rKhPEe	lecturer	2026-03-21 05:46:21.657754	\N	f
24	Charuka Herath	charuka.h@1campus.edu	$2b$10$pGsCG1f1KknltaHmt6h...XcIn0LBQXN7n09XGKBhSBxLcRryIyYC	admin_staff	2026-03-21 05:51:04.251626	\N	f
\.


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 382, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.messages_id_seq', 1, false);


--
-- Name: module_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.module_materials_id_seq', 17, true);


--
-- Name: modules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.modules_id_seq', 132, true);


--
-- Name: quiz_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.quiz_questions_id_seq', 50, true);


--
-- Name: quiz_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.quiz_submissions_id_seq', 5, true);


--
-- Name: quizzes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.quizzes_id_seq', 5, true);


--
-- Name: student_applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.student_applications_id_seq', 20, true);


--
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.students_id_seq', 657, true);


--
-- Name: tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tickets_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 678, true);


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
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


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
-- Name: quiz_questions quiz_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_pkey PRIMARY KEY (id);


--
-- Name: quiz_submissions quiz_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quiz_submissions
    ADD CONSTRAINT quiz_submissions_pkey PRIMARY KEY (id);


--
-- Name: quiz_submissions quiz_submissions_quiz_id_student_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quiz_submissions
    ADD CONSTRAINT quiz_submissions_quiz_id_student_id_key UNIQUE (quiz_id, student_id);


--
-- Name: quizzes quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_pkey PRIMARY KEY (id);


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
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


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
-- Name: idx_messages_pair; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_messages_pair ON public.messages USING btree (sender_id, receiver_id);


--
-- Name: idx_questions_quiz; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_questions_quiz ON public.quiz_questions USING btree (quiz_id);


--
-- Name: idx_quizzes_module; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_quizzes_module ON public.quizzes USING btree (module_id);


--
-- Name: idx_submissions_student; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_submissions_student ON public.quiz_submissions USING btree (student_id);


--
-- Name: idx_tickets_student_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_tickets_student_id ON public.tickets USING btree (student_id);


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
-- Name: quiz_questions quiz_questions_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- Name: quiz_submissions quiz_submissions_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quiz_submissions
    ADD CONSTRAINT quiz_submissions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- Name: quiz_submissions quiz_submissions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quiz_submissions
    ADD CONSTRAINT quiz_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: quizzes quizzes_lecturer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_lecturer_id_fkey FOREIGN KEY (lecturer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: quizzes quizzes_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;


--
-- Name: student_applications student_applications_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.student_applications
    ADD CONSTRAINT student_applications_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: tickets tickets_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE;


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

\unrestrict DDjdZawLcNzDHAqGujw9OR2BDVX07U5pwqoCfh5rRdB8n9Xz6S87Fe2g01OmC9Z

