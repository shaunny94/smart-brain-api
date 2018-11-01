const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');



const db = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'fatsolab94',
        database: 'smartbrain'

    }
});

db.select('*').from('users').then(data => {
  console.log(data);     
});



const app = express();
app.use(bodyParser.json());
app.use(cors());

// const database = {
//     users: [
//         {
//             id: '123',
//             name: 'John',
//             email: 'john@gmail.com',
//             password: 'cookies',
//             entries: 0,
//             joined: new Date()
//         },
//         {
//             id: '124',
//             name: 'Sally',
//             email: 'sally9@gmail.com',
//             password: 'bananas',
//             entries: 0,
//             joined: new Date()
//         }

//     ],
//     login : [
//         {
//             id: '987',
//             hash: '',
//             email: 'john@gmail.com'
//         }
//     ]
// }

app.get('/', (req, res) => {
    res.send(database.users);
})

app.post('/signin', (req, res) => {
  db.select('email', 'hash').from('login')
  .where('email','=',req.body.email)
  .then(data => {
     const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
     console.log(isValid);
     if (isValid){
        return db.select('*').from('users')
         .where('email', '=', req.body.email)
         .then(user => {
             console.log(user);
             res.json(user[0])
         })
         .catch(err => res.status(400).json('unable to get user'))
     } else {
         res.status(400).json('wrong credentials')
     }
  })
  .catch(err => res.status(400).json('wrong credentials'))
   
})

app.post('/register', (req, res) => {
   const {email, name, password} = req.body;
   const hash = bcrypt.hashSync(password);
   db.transaction(trx => {
       trx.insert({
           hash: hash,
           email: email
       })
       .into('login')
       .returning('email')
       .then(loginEmail => {
        return trx('users')
        .returning('*')
        .insert({
            email: loginEmail[0],
            name: name,
            joined: new Date()
        })
        .then(user => {
            res.json(user[0]);
        })
       })
       .then(trx.commit)
       .catch(trx.rollback)
   })

   .catch(err => res.status(400).json('unable to register'))
})


app.get('/profile/:id', (req, res) => {
    const {id} = req.params;
    db.select('*').from('users').where(
        {id}
    )
    .then(user => {
      if (user.length) {
        res.json(user[0]);
      } else {
        res.status(400).json('Not found')
      }
    })
    .catch(err=> res.status(400).json('error getting user'))
    // if (!found) {
    //     res.status(400).json('not found');
    // }
})

app.put('/image', (req, res) => {
    const {id} = req.body;
    db('users').where('id','=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries => {
        res.json(entries[0]);
    })
    .catch(err => res.status(400).json('unable to get entries'))

})

bcrypt.hash("bacon", null, null, function(err, hash) {
    // Store hash in your password DB.
});

// // Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//     // res = false
// });

app.listen(process.env.PORT || 3000, ()=> {
    console.log(`app is running on port ${process.env.PORT}`);
})


/*
/--> res = this is working
/signin  --> POST = success/fail
/register --> POST = user
/profile/:userId --> GET = user
/image --> PUT --> user



*/