# microservice-description-compilation

This repository is the idea that we can compile microservices from YAML files and a specially written monolithic code base using high level descriptions of what each microservices does. I want to be able to take a monolithic repository written in a certain way and divide it up into microservices automatically. See [idea 82 from my list of ideas](https://github.com/samsquire/ideas#82-inline-http-microservice-compilation). From a sufficiently high level definition of microservices we can:

* **Choreography definition** Define a set of functions to call in order. Let the framework decide how they are called
 * **Divide a codebase** If we have an accurate definition of X number of microservices and how to select the code that corresponds to a microservice, we can divide a codebase into codebases that are a subset of a monolithic codebase. The monolithic codebase remains the source of truth for the system.
 * **Seam selection** If the seams between services are known, we can decide how services communicate with a communication layer, be it method calls, HTTP, database, MQ or some RPC
 **Dynamic seam selection** When containers are on the same host, we could use an IPC method that works on the same machine, such as domain sockets.
 * **Implicit versus explicit communication** Some services do not call each other directly but via subscriptions to generic events.
 * **Stem cell servers** If we bundle code for all microservices together, we can specialise on start-up. A server starts up and decides what service to be and has the code available for all microservices. 
 * **Microservice artifacts** Generate JAR files or python packages or equivalent artifact of a microservice
 * **Endpoints request handlers** Fill in the service handlers with code from the description
 * **Automatic request collaboration** Where one request fans out to multiple requests, we have control over who coordinates what. 
 

# Example 1 - choreography description model

See this example microservice definition of a choreography of a shopping website where you can create an account on checkout. This model has implementation of simple endpoints embedded in the definition, so it should be possible to generate a microservice with code generation.

This flow is called **checkout-new-user** and is the endpoint that would be POSTed to. This endpoint is then responsible for beginning a workflow with the remaining microservices. I see the following options:

* **Generate finish event handlers** Assuming a message queue is being used, we could have a pattern where each microservice knows that they have to raise an event when they have completed a task. Either an orchestrator process monitors the state of the flow or all services are aware of what event must happen next.

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

# Example 2 - Seam configuration model

```
description: an online food delivery service
---
choreography: place-order
steps:
- contact-restaurant
- collect-payment
seams:
- name: contact-restaurant; app -> orders
  kind: REST
- name: contact-restaurant; orders -> restaurant_side
  kind: mq
- name: collect-payment; app -> payments
  kind: REST
- name: collect-payment; payments -> payments_upstream
  kind: mq
---
choreography: user-search-postcode
steps:
- lookup-nearest-restaurants
seams:
- name: user-search-postcode; app->restaurants_search
  kind: REST
---
choreography: app-open
steps:
- download-menu-categories
- download-special-offers
- download-top-restaurants
seams:
- name: download-menu-categories; app->widget_server
  kind: REST
  destination: widget_server
- name: download-special-offers; app->widget_server
  kind: REST
  destination: widget_server
- name: download-top-restaurants; app->widget_server
  kind: REST
  destination: widget_server
---
microservice: offers
package: com.services.offers
---
microservice: widget_server
package: com.services.widget_server
---
microservice: restaurants
package: com.services.restaurants
---
microservice: menus
package: com.services.menus
---
microservice: orders
package: com.services.orders
---
microservice: restaurant_side
package: com.services.restaurant_side
---
microservice: payments
package: com.services.payments
---
microservice: payments_upstream
package: com.services.payments_upstream
---
microservice: search_restaurants
package: com.services.search_restaurants
---
microservice: search_menus
package: com.services.search_menus
```

 # Microservice collaborations
 
 Who is responsible for orchestrating the choreography? Can the framework allow collaborative choreographies by passing additional information regarding the overall flow with the initial request.

 
