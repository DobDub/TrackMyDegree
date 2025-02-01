DROP TABLE IF EXISTS Degree CASCADE;
CREATE TABLE Degree (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  totalCredits INT NOT NULL
);

DROP TABLE IF EXISTS Course CASCADE;
CREATE TABLE Course (
  code VARCHAR(7) NOT NULL,
  credits INT NOT NULL,
  description VARCHAR(2055) NOT NULL,
  PRIMARY KEY (code)
);

DROP TABLE IF EXISTS Requisite CASCADE;
CREATE TABLE Requisite (
  id VARCHAR(255) PRIMARY KEY,
  code1 VARCHAR(7) NOT NULL,
  code2 VARCHAR(7),
  type VARCHAR(3) CHECK (type IN ('pre', 'co')),
  group_id VARCHAR(255),
  creditsRequired INT,
  FOREIGN KEY (code1) REFERENCES Course(code),
  FOREIGN KEY (code2) REFERENCES Course(code),
  CONSTRAINT UC_Requisite UNIQUE (code1, code2, type, group_id, creditsRequired),
  CONSTRAINT CK_Requisite_CreditsOrCourse
    CHECK (
      (creditsRequired IS NOT NULL AND code2 IS NULL) OR
      (creditsRequired IS NULL AND code2 IS NOT NULL)
    )
);

DROP TABLE IF EXISTS CoursePool CASCADE;
CREATE TABLE CoursePool (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

DROP TABLE IF EXISTS DegreeXCoursePool CASCADE;
CREATE TABLE DegreeXCoursePool (
  id VARCHAR(255) PRIMARY KEY,
  degree VARCHAR(255),
  coursepool VARCHAR(255),
  creditsRequired INT NOT NULL,
  UNIQUE(degree, coursepool),
  FOREIGN KEY (degree) REFERENCES Degree(id),
  FOREIGN KEY (coursepool) REFERENCES CoursePool(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS CourseXCoursePool CASCADE;
CREATE TABLE CourseXCoursePool (
  id VARCHAR(255) PRIMARY KEY,
  coursecode VARCHAR(7),
  coursepool VARCHAR(255),
  groupId VARCHAR(255),
  UNIQUE(coursecode, coursepool),
  CONSTRAINT UC_CourseXCoursePool UNIQUE (coursecode, coursepool, groupId),
  FOREIGN KEY (coursecode) REFERENCES Course(code),
  FOREIGN KEY (coursepool) REFERENCES CoursePool(id) ON DELETE CASCADE
);

DROP TABLE IF EXISTS AppUser CASCADE;
CREATE TABLE AppUser (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  fullname VARCHAR(255) NOT NULL,
  degree VARCHAR(255),
  type VARCHAR(10) CHECK (type IN ('student', 'advisor', 'admin')) NOT NULL,
  FOREIGN KEY (degree) REFERENCES Degree(id)
);

DROP TABLE IF EXISTS Timeline CASCADE;
CREATE TABLE Timeline (
  id VARCHAR(255) PRIMARY KEY,
  season VARCHAR(10) CHECK (season IN ('fall', 'winter', 'summer1', 'summer2', 'fall/winter', 'summer')) NOT NULL,
  year INT NOT NULL,
  coursecode VARCHAR(7) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  UNIQUE(user_id, coursecode, season, year),
  FOREIGN KEY (coursecode) REFERENCES Course(code),
  FOREIGN KEY (user_id) REFERENCES AppUser(id)
);

DROP TABLE IF EXISTS Deficiency CASCADE;
CREATE TABLE Deficiency (
  id VARCHAR(255) PRIMARY KEY,
  coursepool VARCHAR(255),
  user_id VARCHAR(255),
  creditsRequired INT NOT NULL,
  UNIQUE(user_id, coursepool),
  FOREIGN KEY (coursepool) REFERENCES CoursePool(id),
  FOREIGN KEY (user_id) REFERENCES AppUser(id)
);

DROP TABLE IF EXISTS Exemption CASCADE;
CREATE TABLE Exemption (
  id VARCHAR(255) PRIMARY KEY,
  coursecode VARCHAR(7),
  user_id VARCHAR(255),
  UNIQUE(user_id, coursecode),
  FOREIGN KEY (coursecode) REFERENCES Course(code),
  FOREIGN KEY (user_id) REFERENCES AppUser(id)
);