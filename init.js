(() => {
  'use strict'
  const initState = JSON.parse(document.getElementById('initial-state').textContent)
  const bearerToken = initState.meta['access_token']

  browser.runtime.sendMessage(
    {
      'token': bearerToken,
      'origin': window.location.origin
    }
  )
})()
