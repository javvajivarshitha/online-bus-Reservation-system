import os

d = 'templates'
for f in os.listdir(d):
    if f.endswith('.html'):
        path = os.path.join(d, f)
        with open(path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        content = content.replace('href="index.html"', 'href="/"')
        content = content.replace('href="login.html"', 'href="/login"')
        content = content.replace('href="register.html"', 'href="/register"')
        content = content.replace('href="search.html"', 'href="/search"')
        content = content.replace('href="mybookings.html"', 'href="/my-bookings"')
        content = content.replace('href="tracking.html"', 'href="/tracking"')
        content = content.replace('href="payment.html"', 'href="/payment"')
        content = content.replace('src="js/auth.js"', 'src="/static/js/auth.js"')
        
        with open(path, 'w', encoding='utf-8') as file:
            file.write(content)
