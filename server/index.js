// const express = require('express');
import express from 'express';
import session from 'express-session';
import morgan from 'morgan';

import bodyParser from 'body-parser';

import graphqlHTTP from 'express-graphql';
import schema from './schema';
import db from './db';

import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

const app = express();

const PORT = 3000;

const compiler = webpack(require('../webpack.config.development.js'));

app.use(webpackDevMiddleware(compiler));
app.use(webpackHotMiddleware(compiler));

app.use(bodyParser.json());

// Logging middleware
app.use(morgan('dev'));

app.use(session({
    secret: 'secretkey',
    cookie: {maxAge: 10 * 60 * 1000},
    resave: false,
    saveUninitalized: false,
}));

// GraphQL endpoint
app.use('/graphql', graphqlHTTP((req) => {
    return {
        schema: schema,
        rootValue: req,
        graphiql: true
    };
}));

// Login endpoint. This authenticates the session. We could instead do
// this using GraphQL.
app.post('/login', function (req, res) {
    console.log('initial session: ', req.session);
    const {uid, password} = req.body;
    const user = db.get('users').get(uid).value();
    if (!user || user.password != password) {
        return res.send('login failed');
    }
    req.session.user = user;
    req.session.authenticated = true;
    console.log('new session: ', req.session);
    console.log('user authenticated: ', user);
    res.send('login successful');
});

// Test authentication
app.get('/auth', function (req, res) {
    console.log('session: ', req.session);
    if(req.session.authenticated){
        res.send('authenticated.');
    } else {
        res.send('not authenticated');
    }
});

const server = app.listen(PORT, () => { console.log(`Demo server listening on port ${server.address().port}`); });
