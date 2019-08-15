const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeMail, sendCancellationMail } = require('../emails/account')

const router = new express.Router()

// Create new user profile
router.post('/users', async (req,res) => {
    
    const user = new User(req.body)

    try {
        await user.save()
        sendWelcomeMail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch(e) {
        res.status(400).send(e)
    }
    
})

// Login into user db
router.post('/users/login', async (req,res) => {
    try {
        const user = await User.findByCredentials(req.body.email,req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch {
        res.status(400).send()
    }
    
})

// Logout of user db
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })

        await req.user.save()
        res.send()
    } catch {
        res.status(500).send()
    }
})

// Logout from all the devices used for login
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch {
        res.status(500).send()
    }
})


// Request to get the user profile
router.get('/users/me', auth, async (req, res) => {
        res.send(req.user)
})

// Request to update the user profile
router.patch('/users/me', auth, async (req,res) => {
    
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name','email','password','age']
    const isAllowedUpdate = updates.every(update => allowedUpdates.includes(update))

    if(!isAllowedUpdate){
        return res.status(400).send({ error: 'Invalis Update(s)!' })
    }

    try {
        
        //Dynamic update for the user object that's why user[update] is used
        updates.forEach(update => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch(e) {
        res.status(400).send(e)
    }
})

// Request to delete the user profile
router.delete('/users/me', auth, async (req,res) => {
    
    try {
        await req.user.remove()
        sendCancellationMail(req.user.email, req.user.name)  
        res.send(req.user)
    } catch(e) {
        res.status(400).send(e)
    }
})

const upload = multer({
        // dest:'avatars',
        limits: {
            fileSize: 1000000
        },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('Please Upload an Image of type jpeg/png file'))
        }    
        cb(undefined, true)
    }
})
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req,res) => {
    
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()

    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.delete('/users/me/avatar', auth, async (req,res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async (req,res) => {
    try{
        const user = await User.findById(req.params.id)
        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch {
        res.status(400).send()
    }
})

module.exports = router