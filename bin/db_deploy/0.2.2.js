/*
*   Siftrock db deploy script version 0.2.2
*
*   Changes:
*       1. Add nlp_config collection and data
*/

now = new Date();

print();
print('--------------------------------');
print('      1. ADDING NLP_CONFIG');
print('--------------------------------');
print();


var cfg = {
    subjectCruft: [
        'automatic reply',
        'out of office',
        'Out of Office',
        'AutoReply',
        'auto',
        'fwd',
        're',
        'fw',
        '[Marketing]',
        '[mktg]',
        '[bulk]',
        'undeliverable'
    ],
    phoneNumberRegex: [
        { country: 'US', regex: '([+](\\d{1}|\\d{2}).)?(\\([2-9]|[2-9])(\\d{2}|\\d{2}\\))([-]|[.]|\\s)?\\d{3}(-|[.]|\\s)?\\d{4}([,. ]{0,2})((x|ext|extension).{0,2}?[0-9]{1,4})?' },
        { country: 'UK', regex: '[(]?(020[78]?[)]?[ ]?[1-9][0-9]{2,3}[ ]?[0-9]{4})|(0[1-8][0-9]{3}[)]?[ ]?[1-9][0-9]{2}[ ]?[0-9]{3})([,. ]{0,2})((x|ext|extension).{0,2}?[0-9]{1,4})?' },
        { country: 'DE', regex: '(\\d{3}([ .-])?)(\\d{3}([ .-])?)(\\d{2}([ .-])?)(\\d{3})([,. ]{0,2})((x|ext|extension).{0,2}?[0-9]{1,4})?' }
    ],
    messageType: {
        left: [
            'i have left',
            'no longer at',
            'no longer part',
            'no longer employed',
            'no longer with',
            'not longer with',
            'no longer works',
            'no longer working',
            'longer an employee',
            'my last day',
            'all future emails',
            'all future correspondence',
            'is no longer valid'
        ],
        changed: [
            'no longer in use',
            'phasing out',
            'email address changed',
            'update address',
            'not monitoring',
            'not monitored',
            'invalid email address',
            'invalid address',
            'resend your email',
            'no longer valid',
            'is no longer'
        ],
        vacation: [
            'annual leave',
            'on leave',
            'will be back',
            'vacation',
            'holiday'
        ],
        general: [
            'out of office',
            'out of the office',
            'not in the office',
            'currently away',
            'maternity leave',
            'i am away',
            'i am out',
            'limited access to',
            'will be returning',
            'need immediate assistance',
            'will respond when'
        ],
        system: [
            'our hours are',
            'thank you for contacting',
            'immediate response',
            'do not reply',
            'has been received'
        ]
    }
}

db.nlp_config.insert(
    cfg
);

print('Done updating nlp_config');

