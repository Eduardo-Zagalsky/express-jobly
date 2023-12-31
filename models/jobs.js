"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
    /** Create a job (from data), update db, return new job data.
     *
     * data should be { handle, name, description, numEmployees, logoUrl }
     *
     * Returns { handle, name, description, numEmployees, logoUrl }
     *
     * Throws BadRequestError if job already in database.
     * */

    static async create({ id, title, salary, equity }) {
        const duplicateCheck = await db.query(
            `SELECT id, title, salary, equity
           FROM jobs
           WHERE id = $1`,
            [id]);

        if (duplicateCheck.rows[0])
            throw new BadRequestError(`Duplicate job: ${id}`);

        const result = await db.query(
            `INSERT INTO jobs
           (id, title, salary, equity)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity`,
            [
                id,
                title,
                salary,
                equity
            ],
        );
        const job = result.rows[0];

        return job;
    }

    /** Find all jobs.
     *
     * Returns [{ id, title, salary, equity }, ...]
     * */

    static async findAll() {
        const jobsRes = await db.query(
            `SELECT id,
                  title,
                  salary,
                  equity
           FROM jobs
           ORDER BY name`);
        return jobsRes.rows;
    }

    /** Given a job handle, return data about job.
     *
     * Returns { handle, name, description, numEmployees, logoUrl, jobs }
     *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
     *
     * Throws NotFoundError if not found.
     **/

    static async get(id) {
        const jobRes = await db.query(
            `SELECT
            id,
             title,
              salary,
               equity
           FROM jobs
           WHERE id = $1`,
            [id]);

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    /** Update job data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {name, description, numEmployees, logoUrl}
     *
     * Returns {handle, name, description, numEmployees, logoUrl}
     *
     * Throws NotFoundError if not found.
     */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
                id: "id", title: "title", salary: "salary", equity: "equity"
            });
        const handleVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${handleVarIdx} 
                      RETURNING id, title, salary, equity`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    /** Delete given job from database; returns undefined.
     *
     * Throws NotFoundError if job not found.
     **/

    static async remove(id) {
        const result = await db.query(
            `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
            [id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);
    }
}


module.exports = Job;
