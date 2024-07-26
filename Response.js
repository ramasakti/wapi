const response = (code, data, message, res) => {
    res.status(code).send({
        payload: data,
        message,
        metadata: {
            prev: "",
            next: "",
            current: ""
        }
    })
}

module.exports = response