* Fetch
    * fetch(url) -> Get rquest 
    * fetch(url, options)

Github repo Browser

enter github username [         ] [submit]

* homework01
* final-project

Use an existing API for this
Github's api 

Web based API
rest based 
api docs
```link
https://docs.github.com/en/rest/users/users?apiVersion=2022-11-28&versionId=free-pro-team%40latest&productId=rest
```
* auth required?
    * token
    * oauth
* Method
* path
* What is the body of the response

1. Create HTML
2. add event listener for button click and value
3. make background request
4. insert data into the dom

## Same origin Policy

Same site:
* protocol
* domain 
* port

... are all the same ... if any of these are different

Implemented by your client / browser
* rules governing what to do when a background request is made
* from one origin to another different origin (one that is not 'same site', basically a "cross site" request)

1. if the request is a simple GET or POST (content tpye is x-www-form-urlencoded)... if request is cross-site, then client can't read response
    * note that request is NOT blocked
    * but instead request can't be read by client side js
2. If the request is a "complex" POST request (content type is application/json), thhen 
    * "pre-flight" request is sent first
    * ... and then actual POST if response to pre flight request is appropriate 
    * request may be blocked completely

Scenario 1 - Reading information from active session via csrf, but prevented by SOP
* I'm already logged in to my bank mybank.pizza
* I go to notsuspicious.txt
    * fetch(mybank.pizza) ... sends along cookies
    * 🚫 read information that is behind auth
        * SOP prevents this fetch from reading response on cross-site request
        * Prevents cross site request forgery (csrf) ... sending request to other site as active session for user
    
Scenario 2 - 

* I'm already logged in to my bank mybank.pizza
* I go to notsuspicious.lol
    * fetch(mybank.pizza, {method:'POST', headers: {'content-type':'x-www-form-urlencoded'}}) ... sends along cookies, POST is possibly destructive
* sends along cookies, POST is possibly destructive
    * post request will go through, but can't read the response
    * in this case SOP is not adequate
    * in some forms, you might have an extra input field (input type = "hidden")
    * it's value is some token unique that form
    * <form...>
    * <input type="hidden" name = "csrf token" value = "1234567654321asdfghgfdsa">
    * when post request is made
        * server will check that value exists in body
        * value was same one set in markup
        * if it doesn't exist or not same in markup, then implementation is request did not come from form submission (or it's a stale form)

how to circumvent SOP

1. (as a user) use a client that had SOP disabled/ not implemented
2. (as a devleoper of an API consuming app)
    * use a client that doesnt'implement SOP 
    * serve that data using my own API (served from same site)
    * use fetch like normal

    
                fetch in chrome XXXXX
mysite.ninja -----------------     ---------------------> api.foo.lol

                fetch in chrome
mysite.ninja -----------------api.mysite.ninja---------------------> api.foo.lol
                            middleman, proxy server

3. (as an owner of an api)
    * set appropriate CORS (cross origin resource sharing) headers
    * ... so  that response can be read from cross origin requests that use SOPs