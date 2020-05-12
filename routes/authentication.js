const { Router } = require('express');
const router = new Router();

const User = require('./../models/user');
const bcryptjs = require('bcryptjs');

/*START EMAIL CONFIG*/

const nodemailer = require('nodemailer');

const generateId = (length) => {
  const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += characters[Math.floor(Math.random() * characters.length)];
  }
  return token;
};

const transporter = nodemailer.createTransport({
  //host: 'stmp.gmail.com',
  port:465,
  service: 'Gmail', // service we are using
  // authentication
  // never personal email even for test
  auth: {
    type: 'login',
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PW
  }
});

/*END EMAIL CONFIG*/

router.get('/', (req, res, next) => {
  res.render('index');
});

/*
router
  .get('/confirm/:confirmCode', (req, res, next) => {})
  .then()
  .catch((err) => {
    console.log(err);
  });
*/

router.get('/sign-up', (req, res, next) => {
  res.render('sign-up');
});

router.post('/sign-up', (req, res, next) => {
  const { name, email, password } = req.body;
  const confirmationCode = generateId(10);

  bcryptjs
    .hash(password, 10)
    .then((hash) => {
      return User.create({
        name,
        email,
        passwordHash: hash,
        confirmationCode
      });
    })
    .then((user) => {
      req.session.user = user._id;
      return transporter
        .sendMail({
          from: `Vasco <${process.env.NODEMAILER_EMAIL}>`,
          to: email, // put an email
          subject: 'Ironhack-Lab-Nodemailer',
          //text: 'lorem'
          html: `<strong>Ironhack Confirmation Email</strong><p><strong>Hello ${user.name}!</strong></p> 
    <p>Thanks to join our community! Please confirm your account clicking on the following link:
    <a href='http://localhost:3000/auth/confirm/${user.confirmationCode}'></a></p><p><strong>Great to see you creating awsome webpages with us! |-_-|</strong></p>`
        })
        .then((result) => {
          console.log('An email was sent');
          console.log(result);
          res.redirect('/');
        })
        .catch((err) => {
          console.log('There was an error sending the email');
          console.log(err);
        });
    });
});

router.get('/sign-in', (req, res, next) => {
  res.render('sign-in');
});

router.post('/sign-in', (req, res, next) => {
  let userId;
  const { email, password } = req.body;
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return Promise.reject(new Error("There's no user with that email."));
      } else {
        userId = user._id;
        return bcryptjs.compare(password, user.passwordHash);
      }
    })
    .then((result) => {
      if (result) {
        req.session.user = userId;

        res.redirect('/');
      } else {
        return Promise.reject(new Error('Wrong password.'));
      }
    })
    .catch((error) => {
      next(error);
    });
});

router.post('/sign-out', (req, res, next) => {
  req.session.destroy();
  res.redirect('/');
});

const routeGuard = require('./../middleware/route-guard');

router.get('/private', routeGuard, (req, res, next) => {
  res.render('private');
});

module.exports = router;
