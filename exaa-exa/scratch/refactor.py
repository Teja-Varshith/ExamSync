import os

src_dir = r"e:\PROJECTS\EXAMSYNC\exaa-exa\src"

def replace_in_file(filepath, old, new):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    if old in content:
        content = content.replace(old, new)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

# 1. Replace 'college_code' with 'examsync' globally
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.js') or file.endswith('.jsx'):
            path = os.path.join(root, file)
            replace_in_file(path, "'college_code'", "'examsync'")
            replace_in_file(path, '"college_code"', '"examsync"')
            replace_in_file(path, 'college_code/', 'examsync/')

# 2. Update ManageExamites.jsx
manage_examites = os.path.join(src_dir, 'Admin', 'ManageExamites.jsx')
with open(manage_examites, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace email with username, name with password (in form context)
content = content.replace("const [name, setName] = useState('');", "const [username, setUsername] = useState('');\n  const [password, setPassword] = useState('');")
content = content.replace("const [email, setEmail] = useState('');", "")
content = content.replace("!name.trim() || !email.trim()", "!username.trim() || !password.trim()")
content = content.replace("alert('Please fill in both name and email');", "alert('Please fill in both username and password');")
content = content.replace("if (!email.includes('@') || !email.includes('.')) {", "if (false) {") # disable email validation
content = content.replace("{ name: name.trim(), email: email.trim() }", "{ username: username.trim(), password: password.trim() }")
content = content.replace("setName('');", "setUsername('');\n      setPassword('');")
content = content.replace("setEmail('');", "")
content = content.replace("alert(`✅ ${name.trim()} added as an examite!`);", "alert(`✅ ${username.trim()} added as an examite!`);")

content = content.replace("handleRemove = async (examiteEmail, examiteName)", "handleRemove = async (examiteUsername)")
content = content.replace("Remove \"${examiteName}\" (${examiteEmail})", "Remove user \"${examiteUsername}\"")
content = content.replace("removeExamite(collegeId, examiteEmail)", "removeExamite(collegeId, examiteUsername)")

content = content.replace("key={ex.email || index}", "key={ex.username || index}")
content = content.replace("<div className=\"admin-subject-item-name\">{ex.name}</div>", "<div className=\"admin-subject-item-name\">{ex.username}</div>")
content = content.replace("<span>{ex.email}</span>", "<span>Password: {ex.password}</span>")
content = content.replace("handleRemove(ex.email, ex.name)", "handleRemove(ex.username)")

# Update form inputs
content = content.replace("""<label className="admin-label">
                  <User size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  Full Name
                </label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g. Ravi Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />""", """<label className="admin-label">
                  <User size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  Username
                </label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g. ravi123"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />""")
content = content.replace("""<label className="admin-label">
                  <Mail size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  Gmail Address
                </label>
                <input
                  type="email"
                  className="admin-input"
                  placeholder="e.g. ravi@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />""", """<label className="admin-label">
                  <User size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  Password
                </label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g. pass123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />""")

with open(manage_examites, 'w', encoding='utf-8') as f:
    f.write(content)


# 3. Update AuthorLoginPage.jsx
author_login = os.path.join(src_dir, 'pages', 'AuthorLoginPage', 'AuthorLoginPage.jsx')
with open(author_login, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("const [email, setEmail] = useState('');", "const [username, setUsername] = useState('');\n  const [password, setPassword] = useState('');")
content = content.replace("loginAuthor(email, collegeCode)", "loginAuthor(username, password, collegeCode)")

content = content.replace("""<label className="login-label" htmlFor="author-email">Email Address</label>
            <input
              id="author-email"
              type="email"
              className="login-input"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              autoComplete="email"
            />""", """<label className="login-label" htmlFor="author-username">Username</label>
            <input
              id="author-username"
              type="text"
              className="login-input"
              placeholder="Enter your registered username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="author-password">Password</label>
            <input
              id="author-password"
              type="password"
              className="login-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />""")

content = content.replace("Your email must be registered", "Your username and password must be registered")

with open(author_login, 'w', encoding='utf-8') as f:
    f.write(content)


# 4. Update AuthContext.jsx
auth_context = os.path.join(src_dir, 'context', 'AuthContext.jsx')
with open(auth_context, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("loginAuthor = async (email, collegeId)", "loginAuthor = async (username, password, collegeId)")
content = content.replace("if (!email.trim()) {", "if (!username.trim() || !password.trim()) {")
content = content.replace("return { success: false, error: 'Please enter your email' };", "return { success: false, error: 'Please enter your username and password' };")
content = content.replace("const matchedExamite = examites.find(\n        (e) => e.email.toLowerCase() === email.trim().toLowerCase()\n      );", """const matchedExamite = examites.find(
        (e) => e.username.toLowerCase() === username.trim().toLowerCase() && e.password === password
      );""")
content = content.replace("email: matchedExamite.email,", "username: matchedExamite.username,")
content = content.replace("name: matchedExamite.name || 'Author',", "name: matchedExamite.username || 'Author',")
content = content.replace("This email is not registered", "Invalid username or password")

with open(auth_context, 'w', encoding='utf-8') as f:
    f.write(content)


# 5. Update api.js
api_js = os.path.join(src_dir, 'services', 'api.js')
with open(api_js, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("examites: [{ email, name, createdAt }]", "examites: [{ username, password, createdAt }]")
content = content.replace("examites.some(e => e.email.toLowerCase() === examiteData.email.toLowerCase())", "examites.some(e => e.username.toLowerCase() === examiteData.username.toLowerCase())")
content = content.replace("This email is already registered", "This username is already registered")
content = content.replace("email: examiteData.email.trim().toLowerCase(),\n        name: examiteData.name.trim(),", "username: examiteData.username.trim().toLowerCase(),\n        password: examiteData.password,")

content = content.replace("removeExamite: async (collegeId, email)", "removeExamite: async (collegeId, username)")
content = content.replace("e.email.toLowerCase() !== email.toLowerCase()", "e.username.toLowerCase() !== username.toLowerCase()")

with open(api_js, 'w', encoding='utf-8') as f:
    f.write(content)

print("Update complete!")
