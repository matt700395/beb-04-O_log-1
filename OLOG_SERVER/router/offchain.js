//수도코드입니다.

const {
  authorizationFunctions,
} = require("../controller/offchain/authorization");
const express = require("express");
const router = express.Router();

router.get("/", authorizationFunctions);
router.post("/blogposts", blogpostFunction);

module.exports = router;