import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        ref: 'User',
        required: true,
    },
    password: {
        type: String,
       
    },
    email:{
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const User = mongoose.model('User', userSchema);

export default User;
