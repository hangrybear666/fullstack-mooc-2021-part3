const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const mongoose = require('mongoose')
require('dotenv').config()

/**
 * connecting to a MongoDB instance is handled in this separate component
 * the Person object is assigned to a personSchema, which defines the datatypes and variable names
 */
const Person = require('./models/person')

/**
 * express library for rest call handling
 */
const app = express()

/**
 * json parser
 */
app.use(express.json())

/**
 * access control - not providing actual values seems sufficient
 * allows specific URL to access the server
 * allows this URL to use specified methods only
 */
const corsOptions = {
  // origin: 'http://localhost:3000',
  // methods: "GET, PUT, DELETE, POST"
}
app.use(cors(corsOptions))

/**
 * morgan REST logging middleware
 * the custom token adds logging of added objects for
 * POST requests and PUT requests, otherwise adds null
 */
morgan.token('postBody', function getHeadr (req, res) { // eslint-disable-line
  return Object.keys(req.body).length === 0 ? null : JSON.stringify(req.body)
})
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :postBody'))

/**
 * static is a middleware for returning files
 * allows express to server static content such as webpages in .html format
 * http GET request to ROOT of URL will look in build folder for specified file
 * http GET request to ROOT of URL will serve index.html if no file specified
 * 404 otherwise
 */
app.use(express.static('build'))

/**
 * http GET request to INFO page of URL
 * responds with html page
 */
app.get('/info', (request, response, next) => {
  console.log(`GET info queried by ${request.rawHeaders[2]} : ${request.rawHeaders[3]}`)
  Person.find({}).then(persons => {
    response.send(`<p>Phonebook has info for ${persons.length} people.</p> \n
    ${new Date}`)
  }).catch(error => next(error))
})

/**
 * http GET request to /api/persons of URL
 * responds with json file containing all notes
 */
app.get('/api/persons', (request, response, next) => {
  console.log(`GET full list of persons queried by ${request.rawHeaders[2]} : ${request.rawHeaders[3]}`)
  // response.json(persons)
  Person.find({}).then(persons => {
    console.log(persons)
    response.json(persons)
  }).catch(error => next(error))
})

/**
 * http GET request to /api/persons/id of URL
 * responds with json file containing exactly one note
 */
app.get('/api/persons/:id', (request, response, next) => {
  console.log(`GET person with id ${request.params.id} queried by ${request.rawHeaders[2]} : ${request.rawHeaders[3]}`)
  console.log(request.params.id)
  console.log(typeof request.params.id)
  Person.findById(request.params.id).
    then(person => {
      if (person) {
        response.json(person)
      } else {
        const errorMsg = `<h4 style="color:red">person with id ${request.params.id} not found</h4>`
        response.status(404).send(errorMsg).end()
      }
    }).catch(error => next(error))
})

/**
 * http DELETE request to /api/persons/id of URL
 * responds with nothing, or an error
 */
app.delete('/api/persons/:id', (request, response) => {
  console.log(`DELETE person with id ${request.params.id} queried by ${request.rawHeaders[0]} : ${request.rawHeaders[1]}`)
  Person.findByIdAndDelete(request.params.id).then(person => {
    if (!person) {
      const errorMsg = { error: `Person with id ${request.params.id} not found.` }
      response.statusMessage = errorMsg.error
      console.log('ERROR: ', errorMsg.error)
      response.json(errorMsg)
      response.status(204)
    } else {
      response.status(200).end()
    }
  })
})

/**
 * http POST request to /api/persons/id of URL
 * responds with nothing, or an error
 */
app.post('/api/persons', (request, response, next) => {
  console.log(`POST request received from  ${request.rawHeaders[0]} : ${request.rawHeaders[1]} wanting to add:\n`, request.body)
  const person = request.body
  if (!person.name || !person.number) {
    const errorMsg = { error: 'either name or number missing, no persistence' }
    console.log('ERROR: either name or number missing, no persistence')
    console.log('ERROR: ', errorMsg.error)
    response.json(errorMsg)
    response.status(204)
  } else {
    const newPerson = new Person({
      _id: mongoose.Types.ObjectId(),
      name:person.name,
      number: person.number
    })
    Person.findOne({ name: person.name }).then(person => {
      console.log(person)
      if (person) {
        const errorMsg = { error: `Person with name: ${person.name} already in db` }
        response.statusMessage = errorMsg.error
        console.log('ERROR: ', errorMsg.error)
        response.json(errorMsg)
        response.status(204)
      } else {
        newPerson.save().then(result => {
          console.log('person saved!', result)
          response.json(newPerson)
          response.status(200)
        })
      }
    }).catch(error => next(error))
  }
})

/**
 * http PUT request to /api/persons/id of URL
 * responds with nothing or an error
 */
app.put('/api/persons/:id' , (request, response, next) => {
  console.log(`PUT request received from  ${request.rawHeaders[0]} : ${request.rawHeaders[1]}
  > person with id: ${request.params.id} to be updated
  >> with data:`, request.body)
  if (request.body.number) {
    const filter = { _id: request.params.id }
    const update = { number: request.body.number }
    Person.findOneAndUpdate(filter,update,{ new: true }).then(person => {
      if (person) {
        response.json(person)
        response.status(200)
      } else {
        const errorMsg = { error: `Person with id ${request.params.id} not found.` }
        response.statusMessage = errorMsg.error
        console.log('ERROR: ', errorMsg.error)
        response.json(errorMsg)
        response.status(204)
      }
    }).catch(error => next(error))
  } else {
    const errorMsg = { error: 'no number provided in order to update' }
    response.statusMessage = errorMsg.error
    console.log('ERROR: ', errorMsg.error)
    response.json(errorMsg)
    response.status(204)
  }
})

/**
 * handles all requests not otherwise reflected in the methods of this server
 * @param {XHR} request
 * @param {XHR} response
 */
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

/**
 * processes all errors that are called with next(error) after being caught
 * only in case of a cast error, will this function perform custom actions,
 * all other errors are processed normally by passing them on via next(error)
 * @param {string} error
 * @param {XHR} request
 * @param {XHR} response
 * @param {middleware} next
 * @returns
 */
const errorHandler = (error, request, response, next) => {

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else {
    response.statusMessage = error.message
    console.log('ERROR: ', error.message)
    response.json(error.message)
    response.status(204)
  }

  next(error)
}

// this has to be the last loaded middleware.
app.use(errorHandler)

/**
 * Listener keeping the server alive
 * .env file contains port variable for heroku deployment
 */
const PORT = process.env.PORT || 3002
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})