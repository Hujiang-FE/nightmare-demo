let Nightmare = require('nightmare')
let nightmare = new Nightmare({
    show: true,
    openDevTools: {
        mode: 'detach'
    },
})

nightmare.goto('https://www.hujiang.com')
  .evaluate(function() {
    console.log('hello nightmare')
    console.log('5 second close window')
  })
  .wait(5000)
  .end()
  .then(()=> {
    console.log('close nightmare')
  })
