const express = require('express');
const router = express.Router()

const viewsController = require('../controller/viewsController');

// router.get('/', (req,res,next)=>{
//     res.status(200).render('base',{
//         tour: 'the forest hiker',
//         user: 'sam'
//     });
// })

router.get('/', viewsController.getOverview); 
router.get('/tour/:slug', viewsController.getTour)
router.get('/login',viewsController.getLoginForm)

module.exports = router;