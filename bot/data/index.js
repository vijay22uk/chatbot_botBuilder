const regions = require('./region');
const defaultOptions = [
    {
        title: 'Products and Services',
        isEnabled: true
    },
    {
        title: 'Results & expertise'
    },
    {
        title: 'Resources & Tools'
    },
    {
        title: 'About Armstrong'
    },
    {
        title: 'Results & Expertise at a Glance'
    }
];

const products = [
    {
        title: 'Heating & Cooling',
        isEnabled: true
    },
    {
        title: 'All Products & Building Services'
    },
    {
        title: 'Building Performance Services'
    }
    ,
    {
        title: 'Design Envelope Technology'
    }
    ,
    {
        title: 'Automation & Optimization'
    }
    ,
    {
        title: 'Plumbing & Water Supply'
    }
    ,
    {
        title: 'Fire Safety'
    }
    ,
    {
        title: 'Replacement Parts'
    }
    ,
    {
        title: 'Legacy Products'
    }
]
const heatingCooling = [
    {
        title: 'Commercial Pumps', isEnabled: true
    }, {
        title: 'Packaged Systems'
    }, {
        title: 'Controls & Automation'
    }, {
        title: 'Residential Pumps'
    }, {
        title: 'Accessories'
    },

]
// pumps list with image links
const pumps = [
    {
        "Applications": "HVAC-system pumping and control; general purpose pumping; industrial/process pumping and control (water or glycol based)",
        "Description": 'Pipe-mounted UL 778 pumping unit with integrated intelligent controls for space-saving installation and superior energy performance. Saves up to 75% in energy over comparable traditional constant speed or variable frequency operated pump installations. Remote services through internet to enhance reliability and sustain optimal performance over life of pumps.',
        "title": "Design Envelope 4300 Pumps", "image": "http://armstrongfluidtechnology.com/~/media/images/products/design-envelope-4300-single-pumps/gen5split009_rt.jpg?bc=white&h=125&thn=0&w=148", "isEnabled": true
    },
    {
        "Applications": "HVAC-system pumping and control; general purpose pumping; industrial/process pumping and control (water or glycol based)",
        "Description": "Pipe-mounted 2-pump unit with integrated intelligent controls for space-saving installation, superior energy performance, and parallel-pumping or full redundancy operation. Saves up to 75% in energy over comparable traditional constant speed or variable frequency operated pump installations. Remote services through internet to enhance reliability and sustain optimal performance over life of pumps.",
        "title": "Design Envelope 4322 Tango Pumps", "image": "http://armstrongfluidtechnology.com/~/media/images/products/design-envelope-4322-tango/20170111_tango_splitcoupled90_01_ppt.jpg?bc=white&h=125&thn=0&w=148", "isEnabled": true
    },
    {
        "Applications": "HVAC-system pumping and control; general purpose pumping; industrial/process pumping and control (water or glycol based)",
        "Description": "Pipe-mounted 2-pump unit with integrated intelligent controls for space-saving installation, superior energy performance, and parallel-pumping or full redundancy operation. Saves up to 75% in energy over comparable traditional constant speed or variable frequency operated pump installations. Remote services through internet to enhance reliability and sustain optimal performance over life of pumps.",
        "title": "Design Envelope 4372 Tango Pumps", "image": "http://armstrongfluidtechnology.com/~/media/images/products/design-envelope-4372-tango/tango010_rt.jpg?bc=white&h=125&thn=0&w=148", "isEnabled": true
    },
    {
        "Applications": "HVAC-system pumping and control; general purpose pumping; industrial/process pumping and control (water or glycol based)",
        "Description": "Pipe-mounted UL 778 pumping unit with integrated intelligent controls for space-saving installation and superior energy performance. Saves up to 75% in energy over comparable traditional constant speed or variable frequency operated pump installations. Remote services through internet to enhance reliability and sustain optimal performance over life of pumps.",
        "title": "Design Envelope 4380 Pumps", "image": "http://armstrongfluidtechnology.com/~/media/images/products/design-envelope-4380-single-pumps/gen5vil037_rt.jpg?bc=white&h=125&thn=0&w=148", "isEnabled": true
    },
    {
        "Applications": "HVAC-system pumping; general purpose pumping; industrial/process pumping (water or glycol based)",
        "Description": "Pipe-mounted 2-pump unit with integrated intelligent controls for space-saving installation, superior energy performance, and full redundancy during operation. Saves up to 75% in energy over comparable traditional constant speed or variable frequency operated pump installations.",
        "title": "Design Envelope 4312 Twin Pumps", "image": "http://armstrongfluidtechnology.com/~/media/images/products/design-envelope-4312-twin-pump/design_envelope_4312_isometric_view.jpg?bc=white&h=125&thn=0&w=148", "isEnabled": true
    },
    {
        "Applications": "HVAC-system pumping; general purpose pumping; industrial/process pumping (water or glycol based)",
        "Description": "Pipe-mounted 2-pump unit with integrated intelligent controls for space-saving installation, superior energy performance, and full redundancy during operation. Saves up to 75% in energy over comparable traditional constant speed or variable frequency operated pump installations.",
        "title": "Design Envelope 4392 Twin Pumps", "image": "http://armstrongfluidtechnology.com/~/media/images/products/design-envelope-4392-twin-pumps/design_envelope_4392_twin_isometricview.jpg?bc=white&h=125&thn=0&w=148", "isEnabled": true
    },
    {
        "Applications": "HVAC system pumping; general purpose pumping; industrial/process pumping (water or glycol based)",
        "Description": "Pipe-mounted 2-pump unit with integrated intelligent controls for space-saving installation, superior energy performance, and full redundancy or parallel-pumping operation. Saves up to 75% in energy over comparable traditional constant speed or variable frequency operated pump installations.",
        "title": "Design Envelope 4302 dualArm Pumps", "image": "http://armstrongfluidtechnology.com/~/media/images/products/design-envelope-4302-dualarm-pump/design_envelope_4302_isometric_view.jpg?bc=white&h=125&thn=0&w=148", "isEnabled": true
    },
    {
        "Applications": "HVAC-system pumping; general purpose pumping; industrial/process pumping (water or glycol based)",
        "Description": "Pipe-mounted 2-pump unit with integrated intelligent controls for space-saving installation, superior energy performance, and full redundancy or parallel-pumping operation.",
        "title": "Design Envelope 4382 dualArm Pumps", "image": "http://armstrongfluidtechnology.com/~/media/images/products/design-envelope-4382-dualarm-pump/design_envelope_4382_dualarm_isometric_view.jpg?bc=white&h=125&thn=0&w=148", "isEnabled": true
    }
]

const adaptiveFormCard = {
    'contentType': 'application/vnd.microsoft.card.adaptive',
    'content': {
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "type": "AdaptiveCard",
        "version": "1.0",
        "body": [
            {
                "type": "TextBlock",
                "text": "Thank You!",
                "speak": "<s>Thank You!</s>",
                "weight": "bolder",
                "size": "large"
            },
            {
                "type": "TextBlock",
                "text": "Please provide below details for someone to contact you.",
                "speak": "<s>Please provide below details for someone to contact you.</s>",
                "weight": "bolder",
                "size": "medium"
            },
            {
                "type": "TextBlock",
                "text": "Email Address:"
            },
            {
                "type": "Input.Text",
                "id": "emailid",
                "speak": "<s>Please enter your email id</s>",
                "placeholder": "abc@example.com",
                "style": "text"
            },
            {
                "type": "TextBlock",
                "text": "Contact No.:"
            },
            {
                "type": "Input.Text",
                "id": "contactno",
                "speak": "<s>Please enter your Contact No.</s>",
                "placeholder": "",
                "style": "text"
            },
            {
                "type": "TextBlock",
                "color": "attention",
                "text": "Note: an email will be send to provided email address.",
                "size": "small"
            }
        ],
        "actions": [{
            "type": "Action.Submit",
            "title": "Submit",
            "speak": "<s>Submit</s>",
            "data": {
                "type": "userdetails"
            }
        },{
            "type": "Action.Submit",
            "title": "Cancel",
            "speak": "<s>Cancel</s>",
            "data": {
                "type": "cancel"
            }
        }]
    }
};
const defaultCard = {
    'contentType': 'application/vnd.microsoft.card.adaptive',
    'content':
    {
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "type": "AdaptiveCard",
        "version": "1.0",
        "body": [
            {
                "type": "Container",
                "items": [
                    {
                        "type": "TextBlock",
                        "text": "Here's what I can do:",
                        "weight": "bolder",
                        "size": "large"
                    },{
                        "type": "TextBlock",
                        "text": "• Products & services",
                        "size": "medium",
                        "separator": true
                    }
                    ,{
                        "type": "TextBlock",
                        "text": "• Results & Expertise",
                        "size": "medium",
                        "separator": true
                    }
                    ,{
                        "type": "TextBlock",
                        "text": "• Resources & Tools",
                        "size": "medium",
                        "separator": true
                    }
                    ,{
                        "type": "TextBlock",
                        "text": "• About Armstrong",
                        "size": "medium",
                        "separator": true
                    },{
                        "type": "TextBlock",
                        "text": "• Help & Support",
                        "size": "medium",
                        "separator": true
                    },{
                        "type": "TextBlock",
                        "text": "• Find a Rep",
                        "size": "medium",
                        "separator": true
                    }
                    ]
            }
        ]
    }
}
const pumpCard = {
    'contentType': 'application/vnd.microsoft.card.adaptive',
    'content': {
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "type": "AdaptiveCard",
        "version": "1.0",
        "body": [
            {
                "type": "Container",
                "items": [
                    {
                        "type": "TextBlock",
                        "text": "Design Envelope 4300 Pumps",
                        "weight": "bolder",
                        "size": "medium"
                    },
                    {
                        "type": "ColumnSet",
                        "columns": [
                            {
                                "type": "Column",
                                "width": "auto",
                                "items": [
                                    {
                                        "type": "Image",
                                        "url": "http://armstrongfluidtechnology.com/~/media/images/products/design-envelope-4300-single-pumps/gen5split009_rt.jpg?bc=white&h=545&thn=0&w=865",
                                        "size": "large",
                                        "style": "person"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                "type": "Container",
                "items": [
                    {
                        "type": "TextBlock",
                        "text": "The Armstrong 4300 pipe-mounted pumps are designed for space-saving installation, high operating efficiency, and long service life.",
                        "wrap": true
                    },
                    {
                        "type": "FactSet",
                        "facts": [
                            {
                                "title": "Applications:",
                                "value": "HVAC-system pumping"
                            },
                            {
                                "title": "Materials:",
                                "value": "Cast,ductile iron or bronze casing\n\nCast iron or bronze impeller"
                            },
                            {
                                "title": "Performance range:",
                                "value": "Up to 28,000 USgpm (1,800 L/s) flow"
                            },
                            {
                                "title": "Temperature:",
                                "value": "300oF (150oC)"
                            },
                            {
                                "title": "Power Range:",
                                "value": "1 hp to 1250 hp (0.75 kW to 900 kW)"
                            },
                            {
                                "title": "Size:",
                                "value": "1.5 to 20” (40 mm to 500 mm)"
                            }
                        ]
                    }
                ]
            }
        ]
    }
};
const defaultCardWithImBack = (session)=>{

}

module.exports = {
    regions,
    defaultOptions,
    products,
    pumps,
    pumpCard,
    heatingCooling,
    adaptiveFormCard,
    defaultCard
}