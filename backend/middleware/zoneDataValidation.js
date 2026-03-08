const { body } = require("express-validator");

const createZoneValidation =[

  body("title")
    .notEmpty()
    .withMessage("Title required"),

  body("latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude"),

  body("longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude"),

  body("riskLevel")
    .optional()
    .isIn(["low","medium","high"])

];


module.exports = createZoneValidation;