//   ------------   BACKEND SOCIAL ----------------- // 
//   ------------   BACKEND SOCIAL ----------------- // 



const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userModel = require('./models/user');
const postModel = require('./models/post');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const upload = require('./config/multer-config');

const app = express();


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// view engine configuration
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index');
});


app.get('/login', (req, res) => {
    res.render('login');
});


app.post('/register', async (req, res) => {
    let { name, username, email, age, password } = req.body;
    let user = await userModel.findOne({ email });
    if (user) {
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
                password: hash
            });
            // res.send('Registration successful');
            let token = jwt.sign({ email: email, userid: user._id }, 'secretkey');
            res.cookie("token", token);
            // console.log(token);
            res.send('Registration successful');
        });
    });
    res.redirect('/login');

});



app.post('/login', async (req, res) => {
    let { email, password } = req.body;
    let user = await userModel.findOne({ email });
    // console.log(user);
    if (!user) {
        return res.send('User not found');
    }
    await bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
            let token = jwt.sign({ email: email, userid: user._id }, 'secretkey');
            res.cookie("token", token);
            // console.log(token);
            res.redirect('/profile');
        }
        // else res.redirect('/login');
        // console.log("done");
        else res.redirect('/login');
    });

});

app.get('/profile', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email }).populate("posts");
    console.log(user);
    res.render('profile', { user });
});

// profile pic
app.get('/profile/upload', (req, res) => {
    res.render('profileUpload');
});

app.post('/upload', isLoggedIn,  upload.single('image'), async (req, res) => {
    let user = await userModel.findOne({email: req.user.email});
    user.profilepic = req.file.filename;
    await user.save();

    res.redirect('/profile');
});

// create post
app.post('/post', isLoggedIn, async (req, res) => {

    let user = await userModel.findOne({ email: req.user.email });
    let { title, content } = req.body;

    let now = new Date();
    let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let formattedDate = `${months[now.getMonth()]} ${now.getDate()} ${now.getFullYear()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    let post = await postModel.create({
        title,
        content,
        author: user.username,
        user: user._id,
        likes: [],
        date: formattedDate
    });

    user.posts.push(post._id);
    await user.save();

    // console.log("Created Post:", post); 

    res.redirect('/profile');
});


app.get('/delete/:id', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });

    let post = await postModel.findByIdAndDelete(req.params.id);
    user.posts.pull(post._id);
    await user.save();
    res.redirect('/profile');
});


// LIKE POST 
app.get('/like/:id', isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({ _id: req.params.id }).populate("user");
    if (post.likes.indexOf(req.user.userid) === -1) {
        post.likes.push(req.user.userid);
    } else {
        post.likes.splice(post.likes.indexOf(req.user.userid), 1);
    }

    await post.save();
    res.redirect('/profile');
});



// EDIT POST
app.get('/edit/:id', isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({ _id: req.params.id }).populate("user");

    res.render('edit', { post });
});


app.post('/update/:id', isLoggedIn, async (req, res) => {
    let post = await postModel.findByIdAndUpdate(req.params.id, { content: req.body.content });
    res.redirect('/profile');
});



// COMMENTS :
app.get('/comment/:id', isLoggedIn, async (req, res) => {
    let post = await postModel.findById(req.params.id).populate('comments.user');
    res.render('comment', { post });
});


app.post('/comment/:id', isLoggedIn, async (req, res) => {
    let post = await postModel.findById(req.params.id);

    let now = new Date()
    let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let formattedDate = `${months[now.getMonth()]} ${now.getDate()} ${now.getFullYear()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    post.comments.push({
        content: req.body.comment,
        user: req.user._id,
        date: formattedDate,
    });
    await post.save();
    res.redirect(`/comment/${req.params.id}`);
});




app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
});


function isLoggedIn(req, res, next) {
    if (!req.cookies.token) {
        return res.redirect('/login');
    }
    if (req.cookies.token === "") {
        res.redirect('/login');
    }
    else {
        let data = jwt.verify(req.cookies.token, 'secretkey');
        req.user = data;
        next();
    }

}


app.listen(8000, () => {
    console.log("Hello bhai... server running on 8000");
});
