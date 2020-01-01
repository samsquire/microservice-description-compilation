# microservice-description-compilation

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
- new-user:
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
- verify-email:
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
- save-cart:
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
- email-user:
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
- subscribe-user:
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
- check-cart:
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

From this we can generate:

 * **Microservice artifacts**
 * **Endpoints request handlers**
 * **Micorservice collaborations**
 
 # Microservice collaborations
 
 Who is responsible for orchestrating the choreography? Can the framework allow collaborative choreographies by passing additional information regarding the overall flow with the initial request.
 
 
 
