CREATE TABLE Degree (
  id UUID PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) UNIQUE NOT NULL,
  totalCredits INT NOT NULL
);

CREATE TABLE Course (
  code VARCHAR(7) NOT NULL,
  credits INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  components TEXT NOT NULL,
  notes TEXT,
  PRIMARY KEY (code)
);

CREATE TABLE Requisite (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    code VARCHAR(7),
    reqCode VARCHAR(7),
    groupId INT,
    type VARCHAR(3) CHECK (type IN ('pre', 'co')),
    FOREIGN KEY (code) REFERENCES Course(code),
    FOREIGN KEY (reqCode) REFERENCES Course(code)
);

CREATE TABLE CoursePool (
  id UUID PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE DegreeXCoursePool (
  id UUID PRIMARY KEY DEFAULT (UUID()),
  degree VARCHAR(255),
  coursepool VARCHAR(255),
  creditsRequired INT NOT NULL,
  UNIQUE(degree, coursepool),
  FOREIGN KEY (degree) REFERENCES Degree(id),
  FOREIGN KEY (coursepool) REFERENCES CoursePool(id)
);

CREATE TABLE CourseXCoursePool (
  id UUID PRIMARY KEY DEFAULT (UUID()),
  coursecode VARCHAR(7),
  coursepool VARCHAR(255),
  UNIQUE(coursecode, coursepool),
  FOREIGN KEY (coursecode) REFERENCES Course(code), -- Composite foreign key
  FOREIGN KEY (coursepool) REFERENCES CoursePool(id)
);

CREATE TABLE AppUser (  -- Use square brackets for reserved keywords
    id UUID PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    fullname VARCHAR(255) NOT NULL,
    degree VARCHAR(255),
    type VARCHAR(10) CHECK (type IN ('student', 'advisor', 'admin')) NOT NULL,
    FOREIGN KEY (degree) REFERENCES Degree(id)
);

CREATE TABLE Timeline (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    season VARCHAR(10) CHECK (season IN ('fall', 'winter', 'summer1', 'summer2', 'fall/winter', 'summer')) NOT NULL,
    year INT NOT NULL,
    coursecode VARCHAR(7) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    UNIQUE(user_id, coursecode, season, year),
    FOREIGN KEY (coursecode) REFERENCES Course(code), -- Composite foreign key
    FOREIGN KEY (user_id) REFERENCES AppUser (id)  -- Adjusted foreign key reference
);

CREATE TABLE Deficiency (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    coursepool VARCHAR(255),
    user_id VARCHAR(255),
    creditsRequired INT NOT NULL,
    UNIQUE(user_id, coursepool),
    FOREIGN KEY (coursepool) REFERENCES CoursePool(id),
    FOREIGN KEY (user_id) REFERENCES AppUser (id)
);

CREATE TABLE Exemption (
    id UUID PRIMARY KEY DEFAULT (UUID()),
    coursecode VARCHAR(7),
    user_id VARCHAR(255),
    UNIQUE(user_id, coursecode),
    FOREIGN KEY (coursecode) REFERENCES Course(code), -- Composite foreign key
    FOREIGN KEY (user_id) REFERENCES AppUser (id)
);


-- Insert sample values into tables

-- Corrected INSERT statements

-- Insert into Degree table
INSERT INTO Degree (name, totalCredits)
VALUES ('Building Engineering', 119),
       ('Aerospace Engineering', 120),
       ('Civil Engineering', 119),
       ('Computer Engineering', 120),
       ('Computer Science', 90),
       ('Computer Science – Computation Arts', 90),
       ('Data Science', 120),
       ('Electrical Engineering', 120),
       ('Health and Life Sciences', 90),
       ('Industrial Engineering', 120),
       ('Mechanical Engineering', 120),
       ('Software Engineering', 120);

-- Insert into CoursePool table
INSERT INTO CoursePool (name)
VALUES ('Engineering Core'),
       ('Software Engineering Core'),
       ('Computer Science Group: Software Engineering'),
       ('Engineering and Natural Science Group: Software Engineering'),
       ('Software Engineering Electives')
       ('Computer Engineering Core'),
       ('Computer Engineering Electives'),
       ('Electrical Engineering Core'),
       ('Electrical Engineering Electives'),
       ('Computer Science Core'),
       ('Computer Science Complementary Core'),
       ('Computer Science Electives'),
       ('Mathematics Electives: BCompSC'),
       ('General Electives: BCompSc');

-- Insert into DegreeXCoursePool table
INSERT INTO DegreeXCoursePool (degree, coursepool, creditsRequired)
SELECT (SELECT id FROM Degree WHERE name = 'Computer Science'), (SELECT id FROM CoursePool WHERE name = 'Computer Science Core'), 33 UNION ALL
SELECT (SELECT id FROM Degree WHERE name = 'Computer Science'), (SELECT id FROM CoursePool WHERE name = 'Computer Science Complementary Core'), 6 UNION ALL
SELECT (SELECT id FROM Degree WHERE name = 'Computer Science'), (SELECT id FROM CoursePool WHERE name = 'Computer Science Electives'), 18 UNION ALL
SELECT (SELECT id FROM Degree WHERE name = 'Computer Science'), (SELECT id FROM CoursePool WHERE name = 'Mathematics Electives: BCompSC'), 6 UNION ALL
SELECT (SELECT id FROM Degree WHERE name = 'Computer Science'), (SELECT id FROM CoursePool WHERE name = 'General Electives: BCompSc'), 27 UNION ALL

SELECT (SELECT id FROM Degree WHERE name = 'Computer Engineering'), (SELECT id FROM CoursePool WHERE name = 'Engineering Core'), 30.5 UNION ALL
SELECT (SELECT id FROM Degree WHERE name = 'Computer Engineering'), (SELECT id FROM CoursePool WHERE name = 'Computer Engineering Core'), 69.5 UNION ALL
SELECT (SELECT id FROM Degree WHERE name = 'Computer Engineering'), (SELECT id FROM CoursePool WHERE name = 'Computer Engineering Electives'), 20 UNION ALL

SELECT (SELECT id FROM Degree WHERE name = 'Electrical Engineering'), (SELECT id FROM CoursePool WHERE name = 'Engineering Core'), 30.5 UNION ALL
SELECT (SELECT id FROM Degree WHERE name = 'Electrical Engineering'), (SELECT id FROM CoursePool WHERE name = 'Electrical Engineering Core'), 72.5 UNION ALL
SELECT (SELECT id FROM Degree WHERE name = 'Electrical Engineering'), (SELECT id FROM CoursePool WHERE name = 'Electrical Engineering Electives'), 17 UNION ALL

SELECT (SELECT id FROM Degree WHERE name = 'Software Engineering'), (SELECT id FROM CoursePool WHERE name = 'Engineering Core'), 30.5 UNION ALL
SELECT (SELECT id FROM Degree WHERE name = 'Software Engineering'), (SELECT id FROM CoursePool WHERE name = 'Software Engineering Core'), 47.5 UNION ALL
SELECT (SELECT id FROM Degree WHERE name = 'Software Engineering'), (SELECT id FROM CoursePool WHERE name = 'Computer Science Group: Software Engineering'), 23 UNION ALL
SELECT (SELECT id FROM Degree WHERE name = 'Software Engineering'), (SELECT id FROM CoursePool WHERE name = 'Engineering and Natural Science Group: Software Engineering'), 3 UNION ALL
SELECT (SELECT id FROM Degree WHERE name = 'Software Engineering'), (SELECT id FROM CoursePool WHERE name = 'Software Engineering Electives'), 16;

-- CourseXCoursePool table
INSERT INTO CourseXCoursePool (id, coursecode, coursepool)
VALUES ('1', 'COMP335', '1'),  -- CourseID 1 linked to CoursePoolID 1
       ('2', 'SOEN363', '2'),  -- CourseID 2 linked to CoursePoolID 2
       ('3', 'SOEN287', '3');  -- CourseID 3 linked to CoursePoolID 3

-- User table (changed from AppUser to [User])
INSERT INTO AppUser (id, email, password, fullname, degree, type)
VALUES ('1', 'jd1@concordia.ca', '1234', 'John Doe', '1', 'student'),
       ('2', 'jd2@concordia.ca', '5678', 'Jane Doe', '', 'advisor');

-- Timeline table
INSERT INTO Timeline (id, season, year, coursecode, user_id)
VALUES ('1', 'winter', 2024, 'COMP335', '1'),  -- UserID 1's timeline for winter 2024
       ('2', 'fall', 2025, 'COMP335', '2');  -- UserID 2's timeline for fall 2025

-- Deficiency table
INSERT INTO Deficiency (id, coursepool, user_id, creditsRequired)
VALUES ('1', '1', '1', 3),  -- UserID 1 has a deficiency
       ('2', '2', '2', 3);  -- UserID 2 has a deficiency

-- Exemption table
INSERT INTO Exemption (id, coursecode, user_id)
VALUES ('1', 'COMP335', '1');  -- UserID 1 has an exemption

