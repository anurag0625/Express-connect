const mongoose = require('mongoose');


const postSchema = mongoose.Schema({
    title: String,
    content: String,
    author: String,
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    likes : [
        {
            type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
        }
    ],
    comments: [{
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        },
        content: String,
        date: { 
            type: String,  
            default: () => new Date().toString()  
        }
    }],
    date: { 
        type: String,  
        default: () => new Date().toString()  
    }
});

module.exports = mongoose.model('Post' , postSchema);