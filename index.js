const express = require('express')
const cors = require('cors')
const morgan = require('morgan')

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
morgan.token('postBody', function getHeadr (req,res) {
  return Object.keys(req.body).length === 0 ? null : JSON.stringify(req.body)
})
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :postBody'))

let persons = [
    {
      "id": 1,
      "name": "Arto Hellas",
      "number": "040-123456"
    },
    {
      "id": 2,
      "name": "Ada Lovelace",
      "number": "39-44-5323523"
    },
    {
      "id": 3,
      "name": "Dan Abramov",
      "number": "12-43-234345"
    },
    {
      "id": 4,
      "name": "Mary Poppendieck",
      "number": "39-23-6423122"
    }
  ]

/**
 * http GET request to ROOT of URL
 * responds with html page
 */
app.get('/', (request, response) => {
  console.log(`GET server root queried by ${request.rawHeaders[2]} : ${request.rawHeaders[3]}`)
  response.send('<h1>Hello World!</h1>')
})

/**
 * http GET request to INFO page of URL
 * responds with html page
 */
 app.get('/info', (request, response) => {
  console.log(`GET info queried by ${request.rawHeaders[2]} : ${request.rawHeaders[3]}`)
  response.send(`<p>Phonebook has info for ${persons.length} people.</p> \n
  ${new Date}`)
})

/**
 * http GET request to /api/persons of URL
 * responds with json file containing all notes
 */
app.get('/api/persons', (request, response) => {
  console.log(`GET full list of persons queried by ${request.rawHeaders[2]} : ${request.rawHeaders[3]}`)
  response.json(persons)
})

/**
 * http GET request to /api/persons/id of URL
 * responds with json file containing exactly one note
 */
app.get('/api/persons/:id', (request, response) => {
  console.log(`GET person with id ${request.params.id} queried by ${request.rawHeaders[2]} : ${request.rawHeaders[3]}`)
  const id = Number(request.params.id)
  const person = persons.find(person => person.id === id)
  if (person) {
    response.json(person)
  } else {
    const errorMsg = `<h4 style="color:red">person with id ${id} not found</h4>`
    response.status(404).send(errorMsg).end()
  }
})

/**
 * http DELETE request to /api/persons/id of URL
 * responds with nothing, or an error
 */
app.delete('/api/persons/:id', (request, response) => {
  console.log(`DELETE person with id ${request.params.id} queried by ${request.rawHeaders[0]} : ${request.rawHeaders[1]}`)
  const id = Number(request.params.id)
  const person = persons.find(person => person.id === id)
  if(person) {
    persons = persons.filter(person => person.id !== id )
    response.status(200).end()
  } else {
    const errorMsg = {error:  `Person with id ${id} not found.`}
      response.statusMessage = errorMsg.error
      console.log("ERROR: ", errorMsg.error)
      response.json(errorMsg)
      response.status(204)
  }
})

/**
 * http POST request to /api/persons/id of URL
 * responds with nothing, or an error
 */
app.post('/api/persons', (request, response) => {
  console.log(`POST request received from  ${request.rawHeaders[0]} : ${request.rawHeaders[1]} wanting to add:\n`, request.body)
  const person = request.body
  const newId = persons.length > 0 ? Math.max(...persons.map(person => person.id +1)) : 0
  if (!person.name || !person.number) {
    console.log("ERROR: either name or number missing, no persistence")
    response.statusMessage = `Object not in correct format`
    response.status(204).end()
  } else {
    const newPerson = {
      id: newId,
      name:person.name,
      number: person.number
    }
    const existingPerson = persons.find(person => person.name === newPerson.name)
    if (existingPerson) {
      const errorMsg = {error: `Person already in db`}
      response.statusMessage = errorMsg.error
      console.log("ERROR: ", errorMsg.error)
      response.json(errorMsg)
      response.status(204)
    } else {
      persons = persons.concat(newPerson)
      response.json(newPerson)
      response.status(200)
    }
  }
})

/**
 * http PUT request to /api/persons/id of URL
 * responds with nothing or an error
 */
app.put('/api/persons/:id' , (request, response) => {
  console.log(`PUT request received from  ${request.rawHeaders[0]} : ${request.rawHeaders[1]}
  > person with id: ${request.params.id} to be updated
  >> with data:`, request.body)
  const id = Number(request.params.id)
  const person = persons.find(person => person.id === id)
  if(person) {
    if (request.body.number) {
      const updatedPerson = {...person, number: request.body.number}
      persons = persons.map(person => person.id === id ? updatedPerson :  person)
      response.json(updatedPerson)
      response.status(200)
    } else {
      const errorMsg = {error: `no number provided in order to update`}
      response.statusMessage = errorMsg.error
      console.log("ERROR: ", errorMsg.error)
      response.json(errorMsg)
      response.status(204)
    }
  } else {
    const errorMsg = {error: `Person with id ${id} not found.`}
    response.statusMessage = errorMsg.error
    console.log("ERROR: ", errorMsg.error)
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
 * Listener keeping the server alive
 */
const PORT = 3002
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})