const socket = io()

const $messageFormInput = document.querySelector('.input')
const $messageFormButton = document.querySelector('.submit-button')
const $messageForm = document.querySelector('#message-form')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML


//options
const {username, room} = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () =>
{
    //new message element
    const $newMessage = $messages.lastElementChild

    //height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    //height of messages container
    const containerHeight = $messages.scrollHeight

    ////how far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset)
    {
        $messages.scrollTop = $messages.scrollHeight
    }



}

$messageFormButton.addEventListener('click', e => 
{
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    socket.emit('sendMessage', $messageFormInput.value, error => 
    {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ""
        $messageFormInput.focus()

        if(error)
            return console.log(error)
        
        console.log('Message delivered')
    })
})

socket.on('message', (message) => 
{
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    
    autoscroll()
})

socket.on('locationMessage', location => 
{
    const html = Mustache.render(locationTemplate, {
        username: location.username,
        location: location.location,
        createdAt: new moment(location.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$sendLocationButton.addEventListener('click', () => {
    
    if(!navigator.geolocation)
        return alert('Geolocation not supported')

    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition(({ coords }) => 
    {
        socket.emit('sendLocation', {
            lat: coords.latitude,
            long: coords.longitude,
        }, () => {
            $sendLocationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join', { username, room }, (error) =>
{
    if(error)
    {
        alert(error)
        location.href = '/'
    }
})