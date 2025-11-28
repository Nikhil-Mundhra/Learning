const url = 'https://localhost/3000'

const req = new XMLHttpRequest();

req.open('GET', url, true)

req.addEventListener('load', function (obj){
    if (req.status > 200 && req.status < 400){
        const messages = JSON.parse(req.responseText);
    } else {
        const div = error;
    }
});

req.addEventListener('error', function (obj){

});