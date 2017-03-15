var newTag = {};

newTag.pestSelect = function(select) {
  var type = select.options[select.selectedIndex].value;
  newTag.hideAllBut(type);
  switch(type) {
    case 'Pest':
      console.log('New Pest');

      break;
  }
  console.log(type);
};

newTag.hideAllBut = function(type) {
  for (var i in newTag.formNames) {
    var name = newTag.formNames[i];
    console.log(name);
    var form = document.getElementById(name);
    if (name == type)
      form.hidden = false;
    else
      form.hidden = true;
  }
};

newTag.formNames = [
  'pest',
  'bird',
  'human',
  'trap',
  'nothing',
  'other',
];
