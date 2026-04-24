const express = require('express');
const {
  getCatas,
  getCata,
  createCata,
  updateCata,
  deleteCata,
} = require('../controllers/cataController');

const router = express.Router();

router.route('/').get(getCatas).post(createCata);
router.route('/:id').get(getCata).put(updateCata).delete(deleteCata);

module.exports = router;
