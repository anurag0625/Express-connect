const express = require('express');
const app = express();
const path = require('path');
const userModel = require('./models/user');
const postModel = require('./models/post');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


// Middleware to parse JSON request bodies
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());


//SET view engine for render files
app.set("view engine", "ejs");



// ROUTES 
app.get('/', (req, res) => {
    res.render('index');
});


// To CREATE account --  index.ejs
app.post('/register', async (req, res) => {
    let {name, username, email, age, password} = req.body;
   let user = await userModel.findOne({email});
    if(user){
        return res.send('Email already exists');
    }
    
    bcrypt.genSalt(10, async (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            // crtdUser.password = hash;
            let user = await userModel.create({
                name,
                username,
                email,
                age,
                password : hash
            });
            // res.send('Registration successful');
            let token = jwt.sign({email: email, userid: user._id}, 'secretkey');
            res.cookie("token" , token);
            // console.log(token);
            res.send('Registration successful');
        });
    });

});

// --- LOGIN 

app.get('/login', (req, res) => {
    res.render('login');
})

app.post('/login', async (req, res) => {
    let {email, password} = req.body;
    let user = await userModel.findOne({email});
    // console.log(user);
    if(!user){
        return res.send('User not found');
    }
    await bcrypt.compare(password, user.password, (err, result) => {
        if(result) {
            let token = jwt.sign({email: email, userid: user._id}, 'secretkey');
            res.cookie("token" , token);
            // console.log(token);
            res.redirect('/profile');
        }
        // else res.redirect('/login');
        // console.log("done");
        else res.redirect('/profile');
    });

});


// -- PROILE
app.get('/profile',isLoggedIn, async (req, res) => { 
    let user = await userModel.findOne({email: req.user.email}).populate("posts");
    // console.log(user);
    res.render('profile', {user});
})


app.post('/post', isLoggedIn, async (req, res) => {
    const { content } = req.body;
    const user = await userModel.findOne({email: req.user.email});

    if(!user) { return res.redirect('/login'); }

    const newPost = await postModel.create({
        content,
        author: user.username,
        user: user._id
    });

    user.posts.push(newPost._id);
    await user.save();

    res.redirect('/profile');
});


// DELETE post
app.get('/delete/:id', isLoggedIn, async (req, res) => {
    const post = await postModel.findOneAndDelete({_id: req.params.id});
    if (post) {
        //user associated with the post
        const user = await userModel.findOne({_id: req.user.userid});

        // Remove the post ID from the user's posts array
        if (user) {
            user.posts = user.posts.filter(postId => postId.toString() !== req.params.id);
            await user.save();
        }
    }
    res.redirect('/profile');
});


// LIKE post
app.get('/like/:id', isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({_id: req.params.id}).populate("user");
    if(post.likes.indexOf(req.user.userid) === -1){
        post.likes.push(req.user.userid);
    } else{
        post.likes.splice(post.likes.indexOf(req.user.userid), 1);
    }
    
    await post.save();
    // console.log(post.likes.length);
    res.redirect('/profile');
});


// -- EDIT Post
app.get('/edit/:id', isLoggedIn, async (req, res) => {
    const post = await postModel.findOne({_id: req.params.id});
    const user = await userModel.findOne({_id: req.user.userid});
    res.render('edit', {post, user});
});


app.post('/edit/:id', async (req, res) => {
    let post = await postModel.findOneAndUpdate({_id: req.params.id}, {content: req.body.content});
    res.redirect('/profile');
});


// -- LOGOUT

app.get('/logout', (req, res) => {
    res.cookie("token", "");
    res.redirect('/login');
});


function isLoggedIn(req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect('/login'); 
    }

   
    const data = jwt.verify(token, 'secretkey');
    req.user = data;    
    next(); 
}


//Start
app.listen(3000, () => {
  console.log('Ha bhai server on 3000');
});
