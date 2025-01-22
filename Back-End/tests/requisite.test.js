const request = require("supertest");

const url = process.env.DOCKER_URL || "host.docker.internal:8000";

describe("Requisite Routes", () => {

    // Test for POST /create
    describe("POST /requisite/create", () => {
        it("should create a new requisite", async () => {
            const reqBody = {
                code1: "SOEN287",
                code2: "SOEN363",
                type: "co"
            };

            const response = await request(url)
                .post("/requisite/create")
                .send(reqBody)
                .expect(201);

            // Assert response
            expect(response.body.message).toBe("Requisite created successfully.");
        });

        it("should return error when input is invalid", async () => {
            const response = await request(url)
                .post("/requisite/create")
                .send({
                    code1: "COMP335",
                    code2: "", // Missing code2
                    type: "pre",
                })
                .expect(400);

            expect(response.body.error).toBe("Invalid input. Please provide code1, and code2 as a string.");
        });

    });

    // Test for POST /read
    describe("POST /requisite/read", () => {
        it("should retrieve requisites by code1", async () => {
            const reqBody = { code1: "COMP335" };

            const response = await request(url)
                .post("/requisite/read")
                .send(reqBody)
                .expect(200);

            expect(response.body.message).toBe("Requisites read successfully.");
            expect(Array.isArray(response.body.requisites)).toBe(true);
        });

        it("should retrieve requisites by code1 and code2", async () => {
            const reqBody = { code1: "COMP335", code2: "SOEN363" };

            const response = await request(url)
                .post("/requisite/read")
                .send(reqBody)
                .expect(200);

            expect(response.body.message).toBe("Requisites read successfully.");
            expect(Array.isArray(response.body.requisites)).toBe(true);
        });

        it("should return error if code1 is missing", async () => {
            const response = await request(url)
                .post("/requisite/read")
                .send({ code2: "SOEN363" })
                .expect(400);

            expect(response.body.error).toBe("Invalid input. Please provide code1 as a string.");
        });
    });

    // Test for POST /delete
    describe("POST /requisite/delete", () => {
        it("should delete a requisite successfully", async () => {
            const reqBody = {
                code1: "COMP335",
                code2: "SOEN363",
                type: "pre",
            };

            await request(url).post("/requisite/create").send(reqBody); // Create the requisite first

            const response = await request(url)
                .post("/requisite/delete")
                .send(reqBody)
                .expect(200);

            expect(response.body.message).toBe("Requisite deleted successfully.");
        });

        it("should return error if requisite does not exist", async () => {
            const reqBody = {
                code1: "CS999",
                code2: "MATH999",
                type: "pre",
            };

            const response = await request(url)
                .post("/requisite/delete")
                .send(reqBody)
                .expect(500);

            expect(response.body.error).toBe("Internal server error in /requisite/delete");
        });

        it("should return error for invalid input", async () => {
            const response = await request(url)
                .post("/requisite/delete")
                .send({ code1: "COMP335", code2: "", type: "pre" }) // Invalid code2
                .expect(400);

            expect(response.body.error).toBe("Invalid input.");
        });
    });

});
