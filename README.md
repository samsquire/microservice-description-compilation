# microservice-description-compilation

This repository is the idea that we can compile microservices from YAML files and a specially written monolithic code base using high level descriptions of what each microservices does. I want to be able to take a monolithic repository written in a certain way and divide it up into microservices automatically. See [idea 82 from my list of ideas](https://github.com/samsquire/ideas#82-inline-http-microservice-compilation). From a sufficiently high level definition of microservices we can:

 * **Divide a codebase** If we have an accurate definition of X number of microservices and how to select the code that corresponds to a microservice, we can divide a codebase into codebases that are a subset of a monolithic codebase.
 * **Seam selection** If the seams between services are known, we can decide how services communicate with a communication layer, be it method calls, HTTP, database or some RPC
 * **Stem cell servers** If we bundle code for all microservices together, we can specialise on start-up. A server starts up and decides what service to be and has the code available for all microservices. 
 * **Microservice artifacts** Generate JAR files or python packages or equivalent artifact of a microservice
 * **Endpoints request handlers** Fill in the service handlers with code from the description
 * **Automatic request collaboration** Where one request fans out to multiple requests, we have control over who coordinates what. 
 

# Example

See this example microservice definition:

```
choreography: checkout-new-user
- name: new-user
- name: email-verify-user
- name: save-cart
- name: email-remind-cart
- name: subscribe-user
- name: check-cart
---
microservice: user
functions:
- name: new-user
  resource: users
  method: POST
  inputs:
      email: email
      username: string
      password: string
  impl:
      hashed_password = bcrypt(password)
      user = new User(email, username, hashed_password)
      user.save()
	
---
microservice: email
functions:
- name: verify-email
  resource: emails
  method: POST
  inputs:
      template_name:
          value: verify-email
      email: email
  impl: |
      verify_email = new Email(email, template_name)
      verify_link = create_verify_link()
      sender.send(email.render(verify_link))
---
microservice: cart
functions:
- name: save-cart
  resource: cart
  method: POST
  inputs:
      username: string
      cart_items: object
  outputs:
  - cart-id
  impl: |
  cart = new Cart(cart_items)
  cart.save()
---
microservice: email
functions:
- name: email-user
  resource: emails
  method: POST
  inputs:
      email: email
      template_name: cart-reminder
  impl: |
  email = new Email(email, template_name)
  email.render()
  emailSender.send(email)
---
microservice: newsletter
functions:
- name: subscribe-user
  resource: newsletter/:newsletter/users
  method: POST
  inputs:
      newsletter: string
      email: email
      name: string
  impl: |
  newsletter = NewsletterUsers.get(newsletter)
  newsletter.register_user(name, email)
---
microservice: stock
functions:
- name: check-cart
  resource: check
  method: POST
  inputs:
      cart_id: cart-id
  outputs:
      in-stock: boolean
  impl: |
  cart = Cart.get_cart(cart)
  in_stock = True
  for item in cart.items:
      stock_check = Stock.get_stock(item.name)
      if stock_check.quantity < item.quantity:
          in_stock = False
  return in_stock
```

 # Microservice collaborations
 
 Who is responsible for orchestrating the choreography? Can the framework allow collaborative choreographies by passing additional information regarding the overall flow with the initial request.

 
