var Promise = require('es6-promise').Promise;
import 'fetch';
import "isomorphic-fetch";

import { user } from './auth';


function checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
        return response;
    } else {
        var error = new Error(response.statusText);
        error.response = response;
        throw error;
    }
}


function parseJSON(response) {
    return response.json();
}


function JSONq(method, data) {
    var d = {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }

    if (method == 'GET' || method == 'HEAD') {
        delete d.body;
    }

    if (user.apikey) {
        switch (user.authmethod) {
            case 'token':
                d.headers.Authorization = 'Token ' + user.apikey;
                break;
            case 'google':
                d.headers.Authorization = 'Bearer google-oauth2 ' + user.apikey;
                break;
        }
    }

    return d;
}


function JSONPost(data) {
    return JSONq('POST', data);
}


function JSONGet() {
    return JSONq('GET', {});
}


function URL(path) {
    return HOST + path;
}


function customFetch(path, data) {
    return fetch(URL(path), data).then(checkStatus).then(parseJSON);
}


export default class API {
    static login(email, password) {
        var data = JSONPost({
            username: email,
            password: password
        });

        return customFetch('/api/token/', data);
    }

    static setPos(lat, lon) {
        var data = JSONPost({ lat: lat, lon: lon });
        return customFetch('/api/player/set-pos/', data);
    }

    static nearPlayers() {
        var data = JSONGet();
        return customFetch('/api/player/near/', data);
    }

    static connectPlayer(id, ev) {
        var data = JSONPost({});
        var url = '/api/player/meeting/'+id+'/';
        if (ev) {
            url += ev + '/';
        }
        return customFetch(url, data);
    }

    static allEvents() {
        var data = JSONGet();
        return customFetch('/api/event/all/', data);
    }

    static joinEvent(id) {
        var data = JSONPost({});
        return customFetch('/api/event/join/'+id+'/', data);
    }

    static leaveEvent(id) {
        var data = JSONq('DELETE', {});
        return customFetch('/api/event/unjoin/'+id+'/', data);
    }
}
