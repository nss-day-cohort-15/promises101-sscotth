// PROMISE PRINCIPLE #1: Use `.then` to execute callbacks

// BEFORE: getJSON('data.json, function (data) { console.log(data) }
// GOAL: getJSON('https://randomuser.me/api/').then(function (data) { console.log(data) })

// Start with a "CALLBACKABLE" getJSON function

// function getJSON (url, cb) {
//   var xhr = new XMLHttpRequest()
//   xhr.open('GET', url)
//   xhr.addEventListener('load', function (evt) {
//     cb(JSON.parse(evt.target.responseText))
//   })
//   xhr.send()
// }

// Next, make a "THENABLE" getJSON function

// function getJSON (url) {
//   return {
//     then: function (cb) {
//       var xhr = new XMLHttpRequest()
//       xhr.open('GET', url)
//       xhr.addEventListener('load', function (evt) {
//         cb(JSON.parse(evt.target.responseText))
//       })
//       xhr.send()
//     }
//   }
// }

// Next, make sure to seperate the execution logic between the callback and the async function
// where: getJSON(url) will execute the xhr, but the .then will execute the callback
// i.e. SEPERATION OF CONCERNS

// Usage scenario: get data immediately, but wait to execute callback for 10 seconds
// var request = getJSON(url)
// setTimeout(function () { request.then(function (data) { console.log(data) } }, 10000)

// "THENABLE" getJSON function v2

// function getJSON (url) {
//   var _data // cached data
//   var _cb // cached callback
//   var xhr = new XMLHttpRequest()
//   xhr.open('GET', url)
//   xhr.addEventListener('load', function (evt) {
//     _data = JSON.parse(evt.target.responseText)
//     if (_cb) {
//       _cb(_data) // if the callback is available then execute
//     }
//   })
//   xhr.send()
//
//   return {
//     then: function (cb) {
//       _cb = cb
//       if (data) {
//         cb(data)  // if the data is available then execute
//       }
//     }
//   }
// }

// Implementing this seperation is a bit tricky and difficult to understand. This is where Promises come in.
// Using the Promise constructor, return a promise object from the getJSON function that

// PROMISEIFIED getJSON function

// function getJSON (url) {
//   return new Promise(function (resolve) { // the first argument is a function that should execute on success
//     var xhr = new XMLHttpRequest()
//     xhr.open('GET', url)
//     xhr.addEventListener('load', function (evt) {
//       resolve(JSON.parse(evt.target.responseText)) // works similarly to the simple callback example
//     })
//     xhr.send()
//   })
// }

// PROMISEIFIED getJSON function with error handling
// This is close to jQuery's `$.getJSON` implementation

function getJSON (url) {
  return new Promise(function (resolve, reject) { // the second argument is a function that should execute on error
    var xhr = new XMLHttpRequest()
    xhr.open('GET', url)
    xhr.addEventListener('load', function (evt) {
      // the load event fires when connection was successful
      // check for error status codes (404 means NOT FOUND, 500 means INTERNAL SERVER ERROR, etc... )
      // See https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
      if (evt.target.status < 400) {
        // resolve with raw json rather than the parsed json
        // If an error is thrown here (bad json), then `.catch` will not fire
        resolve(evt.target.responseText)
      } else {
        reject(new Error(evt.target.statusText))
      }
    })
    xhr.addEventListener('error', function (evt) {
      // the error event fires when the connection was unsuccessful (no internet access, bad URL, etc...)
      reject(new Error(evt.target.statusText))
    })
    xhr.send()
  })
  .then(function (json) {
    // parsing the json in its own `.then` allows for proper error handling of malformed json
    return JSON.parse(json)
  })
}

// Promise principle #2: Promise `.then`s can be chained

getJSON('https://randomuser.me/api/')
  .then(function () {
    console.log('`.then` #1 will fire first')
  })
  .then(function (person) {
    console.log('`.then` #2 will fire second')
  })

// The return value of the first then becomes the argument to the second then

getJSON('https://randomuser.me/api/')
  .then(function (arg) {
    console.log("`.then` #1's argument contains the return value of the promise:", arg)
    return 'Hello #2 from #1'
  })
  .then(function (arg) {
    console.log("`.then` #2's argument contains the return value of the first `.then`:", arg)
  })

// Usage example: Chaining `.then`s to give context to your response

// Since different APIs use different data structures in their response.
// If you esing the first `.then` to select the specific data you need it
// allows you to use the second argument to give semantic context
// as to what type of object you are dealing with

// compare this:

getJSON('https://randomuser.me/api/')
  .then(function (response) {
    return response.results[0]
  })
  .then(function (person) {
    console.log('Just the person object:', person)
  })

// to this:

getJSON('http://api.giphy.com/v1/gifs/trending?api_key=dc6zaTOxFJmzC')
  .then(function (response) {
    return response.data
  })
  .then(function (gifs) {
    console.log('Array of gif objects:', gifs)
  })

// Usage Example: Doing multiple things with data
// Further seperating concerns

getJSON('https://randomuser.me/api/')
  .then(function (response) {
    return response.results[0]
  })
  .then(function (person) {
    // return addPersonToDom(person)
  })
  .then(function (person) {
    // return addEventListeners(person)
  })
  .then(function () {
    console.log('Random User Successfully Loaded')
  })

// Similar to chaining `.then`s, Promises also have functions for handling errors
// If an error occurs, the subsequent `.then`s will not execute

getJSON('http://bad.url/')
  .then(function () {
    console.log('wont fire')
  })
  .then(function () {
    console.log('wont fire')
  })
  .then(function () {
    console.log('wont fire')
  })

// If you add a second function argument to `.then`, it will execute if anything above has failed
// (i.e. retry the request or notify the user)

getJSON('http://bad.url')
  .then(function () {
    console.log('wont fire')
  }, function () {
    console.log('second argument will fire on error and continue chain')
  })
  .then(function () {
    console.log('will fire becuase error above was handled')
  })

// However, if an error fires inside a `.then`, the second argument will not catch the error.

getJSON('https://randomuser.me/api/') // GOOD URL
  .then(function () {
    throw new Error('An error occured inside a `.then`')
  }, function () {
    console.log('will only fire if an error occurred higher in the chain')
  })
  .then(function () {
    console.log('wont fire because an unhandled error occured in previous `.then`')
  })

// To handle errors in both places we have `.catch` which will execute and continue the chain

getJSON('http://bad.url')
  .then(function () {
    console.log('wont fire')
  })
  .catch(function () {
    console.log('`.catch` will fire on error and continue chain')
  })
  .then(function () {
    console.log('will fire')
  })

// Sometimes you want to simply stop the chain if an error occurs
// jQuery deferreds (similar to true promises) have a `.fail` method that will execute on error, but not continue the chain

$.getJSON('http://bad.url')
  .then(function () {
    console.log('wont fire')
  })
  .fail(function () {
    console.log('on failure will fire on error but stop chain')
  })
  .then(function () {
    console.log('wont fire')
  })

// EXAMPLES OF CHAINING OR COMPOSING PROMISES WITH `.then`s

// Example 1: 2 sequential requests
// get song a list which returns an array of songs ['Happy Birthday', 'Star Spangled Banner', 'Party in the USA', ...]
// get songs details in 1 request (after the first request finishes)

// if order matters use a `.then` chain

getJSON('songlist.json')
  .then(function (songList) {
    return getJSON('songdetails.json')
  })
  .then(function (songDetails) {
    console.log(songDetails)
  })

// if you need both sets of data you will need to cache the first dataset

var _songList // create a state variable to hold the data
getJSON('songlist.json')
  .then(function (songList) {
    _songList = songList // cache the data
    return getJSON('songdetails.json')
  })
  .then(function (songDetails) {
    console.log(songDetails)
    console.log(_songList) // from cached variable
  })

// if order doesn't matter, then `Promise.all` gives you access to all data at once
// It will execute all promises provided in an array in parallel and execute the `.then` after all finish

Promise.all([
  getJSON('songlist.json'),
  getJSON('songdetails.json')
])
  .then(function (data) {
    // data[0] is songList
    // data[1] is songDetails
  })


// `Promise.race` allows you to make multiple requests in parallel,
// but will execute the `.then` as soon as any of the promises resolve
// example: attempt to get data from two different sources

Promise.race([
  getJSON('http://api.giphy.com/v1/gifs/trending?api_key=dc6zaTOxFJmzC'),
  getJSON('imgur.json')
])
  .then(function (data) {
    // data is whichever finished first
  })

// ADVANCED PROMISE PATTERNS (using forEach with promises)

// i.e. N+1 requests
// get songs list returns 3 ['Happy Birthday', 'Star Spangled Banner', 'Party in the USA']
// need to make 3 more requests for the song details
// i.e. songs.forEach(getSongDetails)

// getJSON('songlist.json')
//   .then(function (songs) {
//     // convert a list of songs into an array of promises
//     return Promise.all(songs.map(function (song) {
//       return getJSON(song)
//     }))
//   })
//   .then(function (details) {
//     // details is an array of all the song details
//   })

// ADVANCED (using Promise.resolve)

// Promise.resolve returns a new Promise
// excellent for converting a synchronous value into a promise
// Promise.resolve(42).then(function (number) { console.log(number) })

// also used for starting an empty promise chain

// Promise.resolve()
//   .then(function () {
//     return getJSON(url)
//   })

// N+1 example above but sequential
// Note: A promise factory is simply a function that returns a promise

// var result = Promise.resolve()
//
// var songPromiseFactories = songs.map(function (song) {
//   return function () { // function wrapping the promise
//     return getJSON(song)
//   }
// })
//
// songPromiseFactories.forEach(function (songPromise) {
//   result = result.then(songPromise)
// })

// result is now a sequential chain of promises

// Advanced: using new HTML5 `fetch` API
// `fetch` uses Promises but returns a Response object and doesn't include a simple JSON string
// `fetch`'s Response is actually "stream" thus a simple `JSON.parse` will not work
// The "Response object" documentation: https://developer.mozilla.org/en-US/docs/Web/API/Response
// It has it's own JSON parse method: `json()`

// Example usage:
// fetch()
//   .then(function (res) {
//     return res.json()
//   })

// composing a fetchJSON function similar to the getJSON function above
// including error handling is trivial

function fetchJSON (url) {
  return fetch(url)
    .then(function (res) {
      return res.json()
    })
}

// Usage:

fetchJSON('http://api.giphy.com/v1/gifs/trending?api_key=dc6zaTOxFJmzC')
  .then(function (data) {
    console.log('`fetch`ed data:', data)
  })
