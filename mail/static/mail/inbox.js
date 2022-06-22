document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email());
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, compose-submit button is disable
  document.querySelector('#compose-submit').disabled = true;
  
  // Ensure recipients and subject are filled
  ensure_form_filled();
  auto_show_recipient();

  email_action_buttons();

  // By default, load the inbox
  load_mailbox('inbox');
  
});

// ============================== Compose and send email ==============================

function compose_email(recipients='', subject='', body='') {

  // Clear all recipients
  document.querySelectorAll('.compose-recipients-done-btn-group').forEach(btns => btns.remove());
  if (document.querySelector('#invalid-feedback')) { document.querySelector('#invalid-feedback').remove() }

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-content-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = recipients;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = body;
}

function send_email(event) {
  event.preventDefault();

  if (document.querySelector('#compose-recipients').value.length > 0) {
    show_recipient(document.querySelector('#compose-recipients').value)
  }

  const post_subject = document.querySelector('#compose-subject').value;
  const post_body = document.querySelector('#compose-body').value;
  let post_recipients = ""

  document.querySelectorAll('.compose-recipients-done-mail').forEach(recipient => {
    post_recipients += recipient.innerHTML + ",";
  });

  post_recipients = post_recipients.slice(0,-1);

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: post_recipients,
        subject: post_subject,
        body: post_body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result)

      // Do something if error ocurred
      if (result.error) {
        let invalid_feedback = document.querySelector('#invalid-feedback');
        if (!invalid_feedback) {
          invalid_feedback = document.createElement('p');
          invalid_feedback.id = "invalid-feedback"
          invalid_feedback.style.fontSize = 'small';
          invalid_feedback.style.color = "#ff4444";
          document.querySelector('#compose-form').insertBefore(invalid_feedback, document.querySelector('#compose-subject-container'));
        }
        invalid_feedback.innerHTML = result.error + ' Try again.'
      } else {
        load_mailbox('sent');
      }
  });
}

function ensure_form_filled() {
  let recipientsDone = false; subjectDone = false;

  document.querySelector('#compose-recipients').onkeyup = () => {
    let compose_recipients = document.querySelector('#compose-recipients').value

    if (compose_recipients.slice(0) === "," || compose_recipients.slice(0) === " ") {
      document.querySelector('#compose-recipients').value = '';
    }
    else {
      if (compose_recipients.slice(-1) === "," || compose_recipients.slice(-1) === " ") {
        while(compose_recipients.slice(-1) === "," || compose_recipients.slice(-1) === " ") {
          compose_recipients = compose_recipients.slice(0, -1);
        }
        show_recipient(compose_recipients);
      }
  
      if (compose_recipients.length > 0 || document.querySelector('#compose-recipients-done').innerHTML.length !== 0) {
        recipientsDone = true;  
        if (subjectDone) {
            document.querySelector('#compose-submit').disabled = false;
          }
      } else {
        document.querySelector('#compose-submit').disabled = true;
        recipientsDone = false;
      }
    }
  }

  document.querySelector('#compose-subject').onkeyup = () => {

    if (document.querySelector('#compose-subject').value.length > 0) {
      subjectDone = true;
      if (recipientsDone) {
        document.querySelector('#compose-submit').disabled = false;
      }
    } else {
      document.querySelector('#compose-submit').disabled = true;
      subjectDone = false;
    }
  }
}

function show_recipient(mail) {
  let new_recipient = document.createElement('div');
  new_recipient.className = 'btn-group mr-1 mb-1 btn-group-sm compose-recipients-done-btn-group';
  new_recipient.role = "group";

  let new_recipient_mail = document.createElement('button');
  new_recipient_mail.type = "button";
  new_recipient_mail.className = "btn btn-secondary compose-recipients-done-mail";
  new_recipient_mail.innerHTML = mail;
  new_recipient_mail.disabled = true;

  let new_recipient_delete = document.createElement('button');
  new_recipient_delete.type = "button";
  new_recipient_delete.className = "btn btn-secondary";
  new_recipient_delete.innerHTML = "x";
  new_recipient_delete.onclick = function() {
    new_recipient.remove();
    if (document.querySelector('#compose-recipients-done').innerHTML.length === 0 && 
        document.querySelector('#compose-recipients').value.length === 0) {
          recipientsDone = false;
          document.querySelector('#compose-submit').disabled = true;
        }
  }

  new_recipient.append(new_recipient_mail);
  new_recipient.append(new_recipient_delete);
  document.querySelector('#compose-recipients-done').append(new_recipient);
  document.querySelector('#compose-recipients').value = '';
}

function auto_show_recipient() {
  document.querySelector('#compose-subject').onclick = () => {
    if (document.querySelector('#compose-recipients').value.length > 0) {
      show_recipient(document.querySelector('#compose-recipients').value)
    }
  }

  document.querySelector('#compose-body').onclick = () => {
    if (document.querySelector('#compose-recipients').value.length > 0) {
      show_recipient(document.querySelector('#compose-recipients').value)
    }
  }
}

// ========================================= Load mailboxes =========================================

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-content-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'block';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // GET all emails related
  fetch('/emails/' + mailbox)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      create_single_email(email);
    })
  });
  
}

function create_single_email(email) {
  let single_email_container = document.createElement('div');
  single_email_container.className = "single-email-container";

  let email_emails     = document.createElement('p');
  let email_subject    = document.createElement('p');
  let email_timestamp  = document.createElement('p');
  
  email_emails.className    = "single-email-emails";
  email_subject.className   = "single-email-subject";
  email_timestamp.className = "single-email-timestamp";

  const isRecipients = document.querySelector('#user-email').innerHTML === email.sender
  email_emails.innerHTML    = (isRecipients) ? email.recipients : email.sender;
  email_subject.innerHTML   = email.subject;
  email_timestamp.innerHTML = email.timestamp;

  single_email_container.append(email_emails);
  single_email_container.append(email_subject);
  single_email_container.append(email_timestamp);
  if (!email.read) { single_email_container.style.backgroundColor = 'white' }

  single_email_container.addEventListener('click', () => email_content_view(email.id));
  document.querySelector('#emails-view').append(single_email_container);
}

// ========================================= Email content view =========================================

function email_content_view(email_id) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-content-view').style.display = 'block';

  document.querySelector('#reply').style.display = 'none';
  document.querySelector('#archive').style.display = 'none';
  document.querySelector('#unarchive').style.display = 'none';
  let toBlock = ""

  // GET email by id
  fetch('/emails/' + email_id)
  .then(response => response.json())
  .then(email => {
      document.querySelector('#email-details-id').innerHTML = email.id;
      document.querySelector('#email-details-from').innerHTML = email.sender;
      document.querySelector('#email-details-to').innerHTML = email.recipients;
      document.querySelector('#email-details-subject').innerHTML = email.subject;
      document.querySelector('#email-content-subject').innerHTML = email.subject;
      document.querySelector('#email-details-timestamp').innerHTML = email.timestamp;
      document.querySelector('#email-details-body').innerHTML = email.body;
      console.log(email.body)
      const lines = email.body.split("\r\n|\r|\n");
      console.log(lines.length);

      toBlock = (email.archived) ? 'unarchive' : 'archive';
      if (email.sender !== document.querySelector('#user-email').innerHTML) {
        document.querySelector('#reply').style.display = 'block';
        document.querySelector(`#${toBlock}`).style.display = 'block';
      }
  });  

  // POST email by id is read
  fetch('/emails/' + email_id, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  });
}

function email_action_buttons() {
  const email_id = document.querySelector('#email-details-id').innerHTML;

  document.querySelector('#archive').addEventListener('click', () => {
    const email_id = document.querySelector('#email-details-id').innerHTML;
    fetch('/emails/' + email_id, {
      method: 'PUT',
      body: JSON.stringify({
          archived: true
      })
    })
    .then(() => load_mailbox('inbox'));
  });

  document.querySelector('#unarchive').addEventListener('click', () => {
    const email_id = document.querySelector('#email-details-id').innerHTML;
    fetch('/emails/' + email_id, {
      method: 'PUT',
      body: JSON.stringify({
          archived: false
      })
    })
    .then(() => load_mailbox('inbox'));
  });

  document.querySelector('#reply').addEventListener('click', () => {
    let subject = document.querySelector('#email-details-subject').innerHTML;
    if (subject.substring(0,4) !== "Re: ") {
      subject = "Re: " + subject;
    }
    const sender = document.querySelector('#email-details-from').innerHTML;
    const body   = document.querySelector('#email-details-timestamp').innerHTML +
                    ' ' + sender + ' wrote:\n' +
                    document.querySelector('#email-details-body').innerHTML + '\n\n';
    
    document.querySelector('#compose-submit').disabled = false;
    compose_email(sender, subject, body)
  })
  
}