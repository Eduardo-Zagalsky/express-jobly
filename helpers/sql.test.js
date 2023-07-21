const sql = require("./sql")

test("test the partial update method", function () {
    let result = sql.sqlForPartialUpdate(
        { "key2": "value2" }, { "key1": "value1" }
    );
    expect(result).toEqual({ "key1": "value1", "key2": "value2" });
})