const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

router.post('/tasks', auth, async (req,res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    try {
        await task.save()
        res.status(201).send(task)
    } catch(e) {
        res.status(400).send(e)
    }
})

router.get('/tasks', auth, async (req, res) => {
       
    const match = {}
    const sort = {}
    
    if(req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
        
    }

    try {
        // let task = {}
        // if (req.query.completed) {
        //     task = await Task.find({
        //         completed: (req.query.completed === 'true' ? true : false),
        //         owner: req.user._id,
        //         options: {
        //             limit: 1
        //         } 
        //     })
                
        // } else {
        //     task = await Task.find({ owner: req.user._id })
        // }
        // res.send(task)
        
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit : parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)   
    } catch {
        res.status(500).send()
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
   try {
        const id = req.params.id
        
        const task = await Task.findOne({ _id: id, owner: req.user._id })

        if(!task){
            return res.status(404).send()
        }
        res.send(task)    
    }catch(e) {
        res.status(500).send(e)
    }
})

router.patch('/tasks/:id', auth, async (req,res) => {

    const updates = Object.keys(req.body)
    const allowedUpdates = ['description','completed']
    const isAllowedUpdate = updates.every(update => allowedUpdates.includes(update))

    if(!isAllowedUpdate) {
        return res.status(400).send({ error: 'Invalid Update(s)!' })
    }
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })
       
               
        //const task = await Task.findByIdAndUpdate(req.params.id, (req.body), { new: true, runValidators: true } )
        if(!task){
            res.status(400).send()
        }

        updates.forEach(update => task[update] = req.body[update])
        await task.save()
        res.send(task)
    } catch(e) {
        res.status(400).send(e)
    }
})

router.delete('/tasks/:id', auth, async (req,res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })

        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    } catch(e) {
        res.status(400).send(e)
    }
})

module.exports = router