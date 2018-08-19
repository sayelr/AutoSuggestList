/*eslint-disable*/
(function($) {
  $(document).ready(function() {
    var people = [
      {id: 1, name: 'Fry', phone: '555-555-1111', tag: true},
      {id: 2, name: 'Leela', phone: '555-555-2222'},
      {id: 3, name: 'Bender', phone: '110-001-0110', tag: 'let\'s go already!'}, 
      {id: 4, name: 'Amy', phone: '555-555-4444'},
      {id: 5, name: 'Zoidberg', phone: '555-555-5555'}, 
      {id: 6, name: 'Farnsworth', phone: '555-555-6666', tag: 'good news, everyone'}, 
      {id: 7, name: 'Hermes', phone: '555-555-7777', tag: 'my manwich!'}, 
      {id: 8, name: 'Scruffy', phone: '555-555-0000'}, 
      {id: 9, name: 'Zapp', phone: '555-555-8888'}, 
      {id: 10, name: 'Kif', phone: '555-555-9999'}, 
      {id: 11, name: 'Morbo', phone: '555-555-1234'}, 
      {id: 12, name: 'Calculon', phone: '555-555-5678'}, 
      {id: 13, name: 'Elzar', phone: '555-555-3333'}
    ];
    
    var states = [
      'Alabama', 'Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
      'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
      'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
      'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
      'New Hampshire','New Jersey','New Mexico','New York','North Carolina',
      'North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island',
      'South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
      'Virginia','Washington','West Virginia','Wisconsin','Wyoming'
    ];
    
    var currentList = people;


    function init() {    
      $('.codeblock').addClass('hidden');
      $('.entry').removeClass('hidden');
      $('#txt').autoSuggestList({
        list: currentList,
        displayProperty: 'name',
        itemSelected: showOutput,
        itemHighlighted: showOutput
      });
      
      $('#btnApply').click(btnApply);
      $('#btnDestroy').click(btnDestroy);
      $('.codeBtn, .sectionBtn').click(showSection);

      $('#txtSearchCond, #txtFormatter').on('keydown', tabs);
      
      setInterval(function () {
        $('#txtSearchCond, #txtFormatter').css('background-color', '#f8f8f8');
        setTimeout(function() {
          $('#txtSearchCond, #txtFormatter').css('background-color', '');
        }, 2000);
      }, 6000);

    }

    init();


    function getOptions() {
      var o = {};
      var list = $('#rbPeople').is(':checked') ? people : states;
      if (list != currentList) {
        o.list = list;
        currentList = list;
      }
      o.displayProperty = $('#txtDP').val();
      o.autoSelectFirst = $('#chkAutoSelectFirst').is(':checked');
      o.autoSelectOnly = $('#chkAutoSelectOnly').is(':checked');
      o.autoSelectOnFocus = $('#chkAutoSelectOnFocus').is(':checked');
      o.matchCase = $('#chkMatchCase').is(':checked');
      var ms = $('#txtMinSearch').val();
      o.minSearchChars = isNaN(parseInt(ms)) ? 0 : parseInt(ms);
      var sd = $('#txtSearchDelay').val();
      o.searchDelay = sd == isNaN(parseInt(sd)) ? 0 : parseInt(sd);
      o.showFullListOnFocus = $('#chkShowFullListOnFocus').is(':checked');
      var si = $('#txtArrowHoldScrollInterval').val();
      o.arrowHoldScrollInterval = isNaN(parseInt(si)) ? 0 : parseInt(si);
    
      o.searchMatchCondition = getCondition();        
      o.textBoxFormatter = getFormatter();
      
      return o;
    }

    function btnApply() {
      $('#txt').autoSuggestList(getOptions());

      $('#txt').autoSuggestList({
        itemSelected: showOutput,
        itemHighlighted: showOutput
      });
      showOutput(null, 'Settings Applied');
    }

    function getCondition() {
      var input = $('#txtSearchCond').val().trim();
      if (input.length == 0) {
        return null;
      }
      var fn = Function('item', 'searchText', 'matchCase', 'displayProperty', input);
      if (fn) return fn;
    }

    function getFormatter() {
      var input = $('#txtFormatter').val().trim();
      if (input.length == 0) {
        return null;
      }
      var fn = Function('item', 'displayProperty', input);
      if (fn) return fn; 
    }

    function btnDestroy() {
      if ($('#txt').data('sayelAutoSuggestList')) {
        $('#txt').autoSuggestList('destroy');
        currentList = null;
      }
      showOutput(null, 'Widget Destroyed');
    }  
    
    function showOutput(event, item) {
      var name;
      if (typeof item == 'string') {
        name = item;
      } else {
        name = item.name;
      }

      var html = !event ? name : '<span class="lbl">event:</span> ' + event.type + '<span class="lbl"> | item:</span> ' + name;    
      
      $('#out').stop(false, true).show()
        .html(html)
        .fadeOut(4000);
    }

    function showSection() {
      var $el = $(this);
      var title = $el.data('title');
      var $sec = $(this).next();
      
      if ($sec.is(':visible')) {
        $sec.fadeOut(250);
        $($el.val('Show ' + title));
      } else {
        $sec.fadeIn(250);
        $($el.val('Hide ' + title));
      }
    }

    function tabs(e) {
      var keyCode = e.keyCode || e.which;

      if (keyCode == 9) {
        e.preventDefault();
        var start = this.selectionStart;
        var end = this.selectionEnd;
        
        $(this).val($(this).val().substring(0, start)
                    + "  "
                    + $(this).val().substring(end));

        // put caret at right position again
        this.selectionStart =
        this.selectionEnd = start + 2;
      }
    }
  });
}(jQuery));