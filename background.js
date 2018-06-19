(() => {
  'use strict'

  const deleteToot = async (tootID) => {
    const xhr = new window.XMLHttpRequest()
    xhr.open('DELETE', `${env.origin}/api/v1/statuses/${tootID}`)
    xhr.setRequestHeader('Authorization', `Bearer ${env.bearerToken}`)
    xhr.setRequestHeader('Content-Type', 'application/json; charset=utf-8')
    xhr.timeout = '3000'
    xhr.responseType = 'json'

    const data = {}

    await xhr.send(JSON.stringify(data))

    if (xhr.status >= 200 && xhr.status < 300) {
      return {
        responce: xhr.response}
    } else {
      return {
        status: xhr.status,
        statusText: xhr.statusText
      }
    }
  }

  const env = {
    origin: '',
    bearerToken: ''
  }
  browser.runtime.onMessage.addListener((msg) => {
    env.bearerToken = msg.token
    env.origin = msg.origin
    chrome.webRequest.onBeforeRequest.addListener(
      listenToot,
      {urls: [`${env.origin}/api/v1/statuses`]},
      ['blocking']
    )
  })

  const decoder = new window.TextDecoder('utf-8')
  const listenToot = (details) => {
    if (!details.method === 'POST') return details
    const streamFilter = browser.webRequest.filterResponseData(details.requestId)

    streamFilter.ondata = (event) => {
      const respStr = decoder.decode(event.data, {stream: true})
      const respJSON = JSON.parse(respStr)

      streamFilter.write(event.data)
      streamFilter.close()

      const tags = respJSON.tags
      if (!tags) return details

      const scaleToNumber = {
        s: 1,
        m: 60,
        h: 60 * 60
      }
      const timeConf = {
        number: null,
        scale: null
      }

      // tags are lowerCase
      for (const tag of tags) {
        const timeLimit = /exp([1-9][0-9]*)([smh])/.exec(tag.name)
        if (!timeLimit) continue
        timeConf.number = timeLimit[1]
        timeConf.scale = timeLimit[2]
      }

      if (!timeConf.number) return details
      const deleteTime = timeConf.number * scaleToNumber[timeConf.scale] * 1000
      setTimeout(() => deleteToot(respJSON.id), `${deleteTime}`)
    }

    return details
  }
})()
