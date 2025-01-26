-- Active: 1731210639535@@localhost@1433@master
CREATE TABLE Degree (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  totalCredits INT NOT NULL
);

CREATE TABLE Course (
  code VARCHAR(7) NOT NULL,
  credits INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  PRIMARY KEY (code)
);

CREATE TABLE Requisite (
    id VARCHAR(255) PRIMARY KEY,
    code1 VARCHAR(7),
    code2 VARCHAR(7),
    type VARCHAR(3) CHECK (type IN ('pre', 'co')),
    FOREIGN KEY (code1) REFERENCES Course(code),
    FOREIGN KEY (code2) REFERENCES Course(code)
);

CREATE TABLE CoursePool (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE DegreeXCoursePool (
  id VARCHAR(255) PRIMARY KEY,
  degree VARCHAR(255),
  coursepool VARCHAR(255),
  creditsRequired INT NOT NULL,
  UNIQUE(degree, coursepool),
  FOREIGN KEY (degree) REFERENCES Degree(id),
  FOREIGN KEY (coursepool) REFERENCES CoursePool(id) ON DELETE CASCADE
);

CREATE TABLE CourseXCoursePool (
  id VARCHAR(255) PRIMARY KEY,
  coursecode VARCHAR(7),
  coursepool VARCHAR(255),
  UNIQUE(coursecode, coursepool),
  FOREIGN KEY (coursecode) REFERENCES Course(code), -- Composite foreign key
  FOREIGN KEY (coursepool) REFERENCES CoursePool(id) ON DELETE CASCADE
);

CREATE TABLE AppUser (  -- Use square brackets for reserved keywords
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    fullname VARCHAR(255) NOT NULL,
    degree VARCHAR(255),
    type VARCHAR(10) CHECK (type IN ('student', 'advisor', 'admin')) NOT NULL,
    FOREIGN KEY (degree) REFERENCES Degree(id)
);

CREATE TABLE Timeline (
    id VARCHAR(255) PRIMARY KEY,
    season VARCHAR(10) CHECK (season IN ('fall', 'winter', 'summer1', 'summer2', 'fall/winter', 'summer')) NOT NULL,
    year INT NOT NULL,
    coursecode VARCHAR(7) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    UNIQUE(user_id, coursecode, season, year),
    FOREIGN KEY (coursecode) REFERENCES Course(code), -- Composite foreign key
    FOREIGN KEY (user_id) REFERENCES AppUser (id)  -- Adjusted foreign key reference
);

CREATE TABLE Deficiency (
    id VARCHAR(255) PRIMARY KEY,
    coursepool VARCHAR(255),
    user_id VARCHAR(255),
    creditsRequired INT NOT NULL,
    UNIQUE(user_id, coursepool),
    FOREIGN KEY (coursepool) REFERENCES CoursePool(id),
    FOREIGN KEY (user_id) REFERENCES AppUser (id)
);

CREATE TABLE Exemption (
    id VARCHAR(255) PRIMARY KEY,
    coursecode VARCHAR(7),
    user_id VARCHAR(255),
    UNIQUE(user_id, coursecode),
    FOREIGN KEY (coursecode) REFERENCES Course(code), -- Composite foreign key
    FOREIGN KEY (user_id) REFERENCES AppUser (id)
);


-- Insert sample values into tables

-- Corrected INSERT statements

-- Degree table
INSERT INTO Degree (id, name, totalCredits)
VALUES ('1', 'Bachelor of Science in Computer Science', 120),
       ('2', 'Bachelor of Arts in Business Administration', 120);

-- Course table
INSERT INTO Course (code, credits, description)
VALUES ('COMP335', 3, 'Introduction to Programming'),
       ('SOEN363', 3, 'Database Systems'),
       ('SOEN287', 3, 'Web Development');

-- Requisite table
INSERT INTO Requisite (id, code1, code2, type)
VALUES ('1', 'COMP335', 'SOEN363', 'pre'),  -- Database Systems requires Introduction to Programming
       ('2', 'SOEN363', 'SOEN287', 'co');  -- Web Development requires Database Systems

-- CoursePool table
INSERT INTO CoursePool (id, name)
VALUES ('1', 'Core Courses'),
       ('2', 'Electives'),
       ('3', 'Special Topics');

-- DegreeXCoursePool table
INSERT INTO DegreeXCoursePool (id, degree, coursepool, creditsRequired)
VALUES ('1', '1', '1', 30),  -- DegreeID 1 linked to CoursePoolID 1
       ('2', '1', '2', 15),  -- DegreeID 1 linked to CoursePoolID 2
       ('3', '2', '3', 12);  -- DegreeID 2 linked to CoursePoolID 3

-- CourseXCoursePool table
INSERT INTO CourseXCoursePool (id, coursecode, coursepool)
VALUES ('1', 'COMP335', '1'),  -- CourseID 1 linked to CoursePoolID 1
       ('2', 'SOEN363', '2'),  -- CourseID 2 linked to CoursePoolID 2
       ('3', 'SOEN287', '3');  -- CourseID 3 linked to CoursePoolID 3

-- User table (changed from AppUser to [User])

INSERT INTO AppUser (id, email, password, fullname, degree, type)
VALUES ('1', 'jd1@concordia.ca', '1234', 'John Doe', '1', 'student'),
       ('2', 'jd2@concordia.ca', '5678', 'Jane Doe', NULL, 'advisor');

-- Timeline table
INSERT INTO Timeline (id, season, year, coursecode, user_id)
VALUES ('1', 'winter', 2024, 'COMP335', '1'),  -- UserID 1's timeline for winter 2024
       ('2', 'fall', 2025, 'COMP335', '2');  -- UserID 2's timeline for fall 2025

-- Deficiency table
INSERT INTO Deficiency (id, coursepool, user_id, creditsRequired)
VALUES ('1', '2', '1', 3),  -- UserID 1 has a deficiency
       ('2', '2', '2', 3);  -- UserID 2 has a deficiency

-- Exemption table
INSERT INTO Exemption (id, coursecode, user_id)
VALUES ('1', 'COMP335', '1');  -- UserID 1 has an exemption

