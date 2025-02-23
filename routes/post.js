var express = require('express');
const {userMiddle, verifyAdmin} = require("../middleware/AuthMiddle");
const postController = require("../controller/postController");
const {upload} = require("../lib/cloudflare");
var router = express.Router();

/* GET post listing. */
router.post('/create',verifyAdmin,upload.array('files',5),postController.createPost);
router.delete('/delete/:postId',verifyAdmin,postController.deletePost);
router.put('/update/:postId',verifyAdmin,upload.array('files',5),postController.updatePost);

router.get('/getAll',userMiddle,postController.getAllPosts);
router.put('/toggleLikePost/:postId',userMiddle,postController.toggleLikePost);
router.put('/comment/:postId',userMiddle,postController.commentPost);
router.get('/getDetail/:postId',userMiddle,postController.getPostDetail);
module.exports = router;
