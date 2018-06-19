(() => {
  'use strict'
  const initState = JSON.parse(document.getElementById('initial-state').textContent)
  const bearerToken = initState.meta['access_token']

  const query = `access_token=${bearerToken}&stream=user`
  const ws = new window.WebSocket(`wss://${window.location.hostname}?${query}`)

  const scaleToNumber = {
    s: 1,
    m: 60,
    h: 60 * 60
  }

  const onMessage = (message) => {
    const recvJSON = JSON.parse(message.data)
    if (recvJSON.event !== 'update') return

    const payload = JSON.parse(recvJSON.payload)
    const tags = payload.tags
    if (!tags) return

    const timeConf = {
      number: null,
      scale: null
    }

    // tags are lowerCase
    const expRegex = /exp([1-9][0-9]*)([smh])/
    for (const tag of tags) {
      const match = expRegex.exec(tag.name)
      if (!match) continue
      timeConf.number = match[1]
      timeConf.scale = match[2]
    }
    if (!timeConf.number) return

    const deleteTime = timeConf.number * scaleToNumber[timeConf.scale] * 1000
    setTimeout(() => deleteToot(recvJSON.id), `${deleteTime}`)
  }

  ws.addEventListener('message', onMessage)
  const deleteToot = async (tootID) => {
    const xhr = new window.XMLHttpRequest()
    xhr.open('DELETE', `${window.location.origin}/api/v1/statuses/${tootID}`)
    xhr.setRequestHeader('Authorization', `Bearer ${bearerToken}`)
    xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8')
    xhr.timeout = '3000'
    xhr.responseType = 'json'

    const data = {}

    await xhr.send(JSON.stringify(data))

    if (xhr.status >= 200 && xhr.status < 300) {
      return {
        responce: xhr.response
      }
    } else {
      return {
        status: xhr.status,
        statusText: xhr.statusText
      }
    }
  }
})()
