const Post = require("../../models/post");

module.exports = {
  /*
    Explore: 모든 posts를 보내줌
    Get /offchain/posts
*/

  list: async (req, res) => {
    try {
      const posts = await Post.find().exec();
      res.status(200).send(posts);
    } catch (e) {
      res.status(404).send(e);
    }
  },

  /*  
  MyPage: post를 게시함
  Post /offchain/posts
  {
      "blogLink": "블로그링크",
      "title" : "제목"
    }
*/

  write: async (req, res) => {
    const { blogLink, title } = req.body;
    const newPost = new Post({
      blogLink,
      title,
      postUserName: res.locals.user.username,
    });

    try {
      await newPost.save();
      res.status(200).send(newPost);
    } catch (e) {
      res.status(404).send(e);
    }
  },

  /* 
    MyPage: 한 명의 유저의 post들을 보내줌
    Get /offchain/posts/:id 
*/
  read: async (req, res) => {
    const { id } = req.params;
    try {
      const post = await Post.findById(id).exec();
      if (!post) {
        res.status(404).send("해당 post가 없습니다.");
        return;
      }
      res.status(200).send(post);
    } catch (e) {
      res.status(404).send(e);
    }
  },
};
