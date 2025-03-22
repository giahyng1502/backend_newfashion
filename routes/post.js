var express = require('express');
const {userMiddle, verifyAdmin} = require("../middleware/AuthMiddle");
const postController = require("../controller/postController");
const {upload} = require("../lib/cloudflare");
var router = express.Router();

/* GET post listing. */
router.post('/create',verifyAdmin,upload.array('files',5),postController.createPost);
router.delete('/delete/:postId',verifyAdmin,postController.deletePost);
router.put('/update/:postId',verifyAdmin,postController.updatePost);

router.get('/getAll',userMiddle,postController.getAllPosts);
router.get('/search',postController.searchPostByHashtag);
router.put('/toggleLikePost/:postId',userMiddle,postController.toggleLikePost);
router.get('/getDetail/:postId',userMiddle,postController.getPostDetails);
module.exports = router;
