document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);


  // By default, load the inbox
  load_mailbox('inbox');

  //send mail
  document.querySelector('#compose-form').onsubmit = () => {
    send_mail()

    // stop form from submitting
    return false;
  }


});


function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#single-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // show rest of the mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {

      let li = document.createElement('div');
      li.innerHTML = `${email.id}. Subject: "${email.subject}". sent to: (${email.recipients}),--- from: (${email.sender}) -------------------- ${email.timestamp}`;
      li.addEventListener('click', () => show_mail(email.id));
      li.style.cursor = 'pointer';

      if (email.read === true) {
        li.style.backgroundColor = 'gray';
      }

      document.querySelector('#emails-view').append(li);
    });
  });
}

function send_mail() {
// get the info from form
// send the email with the API
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
    load_mailbox('sent');
  });
}

function show_mail(id) {
  document.querySelector('#single-view').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  document.querySelector('#single-view').innerHTML = '';

// mark email as read
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  });

// show the email
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    let p = document.createElement('p');
    p.innerHTML = `<span class="font-weight-bold">From:</span> ${email.sender}`;
    document.querySelector('#single-view').append(p);

    p = document.createElement('p');
    p.innerHTML = `<span class="font-weight-bold">To:</span> ${email.recipients}`;
    document.querySelector('#single-view').append(p);

    p = document.createElement('p');
    p.innerHTML = `<span class="font-weight-bold">Subject:</span> ${email.subject}`;
    document.querySelector('#single-view').append(p);

    p = document.createElement('p');
    p.innerHTML = `<span class="font-weight-bold">Timestamp:</span> ${email.timestamp}`;
    document.querySelector('#single-view').append(p);

// make the archive button
    fetch('/emails/sent')
    .then(response => response.json())
    .then(sents => {
      if (!sents.some(sent => sent.id === email.id)) {
        butt = document.createElement('button')
        if (email.archived === false) {
          butt.innerHTML = 'Archive';
          butt.addEventListener('click', function() {
            fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                archived: true
              })
            })
            .then(() => {
              load_mailbox('inbox');
            });
          });
        } else {
          butt.innerHTML = 'Unarchive';
          butt.addEventListener('click', function() {
            fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                archived: false
              })
            })
            .then(() => {
              load_mailbox('inbox');
            });
          });
        }
        butt.className = "btn btn-sm btn-outline-primary";
        butt.style.marginRight = '5px';
        document.querySelector('#single-view').append(butt);
      }

      // make the reply button
      let reply = document.createElement('button');
      reply.innerHTML = 'Reply';
      reply.className = "btn btn-sm btn-outline-primary";
      reply.addEventListener('click', function() {
        reply_email(email)
      });
      document.querySelector('#single-view').append(reply);

      document.querySelector('#single-view').append(document.createElement('hr'));
      // email body
      p = document.createElement('p');
      p.innerHTML = `${email.body}`;
      document.querySelector('#single-view').append(p);
    })
  });
}


function reply_email(email) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#single-view').style.display = 'none';

  // prefill the recipients field with the og email
  document.querySelector('#compose-recipients').value = `${email.sender}`;

  // check if the subject field already starts with "Re: "
  let sub = email.subject;
  let start = sub.substr(0, 3);
  if (start === 'Re:') {
    document.querySelector('#compose-subject').value = `${email.subject}`;
  } else {
    document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
  }

  // prefill the body
  document.querySelector('#compose-body').value = `(On ${email.timestamp} ${email.sender} wrote: ${email.body}) =>`;
}