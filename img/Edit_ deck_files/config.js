
/**
 * A custom plugin which removes needless "&nbsp;" entities
 * after text has been edited. For example:
 *
 * Test regex:
 *
	[
		{ i: 'AAA&nbsp;',							o: 'AAA ' },
		{ i: 'AAA&nbsp;BBB',						o: 'AAA BBB' },
		{ i: 'AAA&nbsp; BBB', 						o: 'AAA&nbsp; BBB' },
		{ i: 'AAA&nbsp;&nbsp;BBB', 					o: 'AAA &nbsp;BBB', },
		{ i: 'AAA&nbsp;&nbsp; BBB', 				o: 'AAA &nbsp; BBB', },
		{ i: 'AAA &nbsp; &nbsp; BBB', 				o: 'AAA &nbsp; &nbsp; BBB', },
		{ i: '<em>&nbsp;</em>', 					o: '<em>&nbsp;</em>', },
		{ i: '<em>a &nbsp;&nbsp;</em>',				o: '<em>a &nbsp; </em>' },
		{ i: 'AAA&nbsp;&nbsp;&nbsp; BBB',           o: 'AAA &nbsp;&nbsp; BBB' },
		{ i: 'AAA&nbsp;&nbsp;&nbsp;&nbsp; BBB',     o: 'AAA &nbsp; &nbsp; BBB' }
	].forEach( function( s ) {
		s.i = s.i.replace( /([^\s>])&nbsp;(?!\s)/gi, '$1 ' );
		s.i = s.i.replace( /&nbsp;&nbsp;&nbsp;/gi, '&nbsp; &nbsp;' );
		console.log( s.i === s.o, s.i );
	} );
 */
CKEDITOR.plugins.add( 'remove-extra-nbsp', {
	afterInit: function( editor ) {
		var dataProcessor = editor.dataProcessor,
			htmlFilter = dataProcessor && dataProcessor.htmlFilter;

		if ( htmlFilter ) {

			htmlFilter.addRules( {
				text: function( text ) {
 					if( text !== '&nbsp;' ) {

						// Strip out all &nbsp; characters that:
						// 1. Are not preceded by either \s or >
						// 2. Are not immediately followed by \s
						text = text.replace( /([^\s>])&nbsp;(?!\s)/gi, '$1 ' );

						// CKEditor/contenteditable uses nbsp so that spacing
						// entered by the user persist visually (multiple regular
						// spaces would collapse). With that in mind, we can reduce
						// the number of consecutive nbsp's as long as we maintain
						// the same visual spacing.
						text = text.replace( /&nbsp;&nbsp;&nbsp;/gi, '&nbsp; &nbsp;' );

					}

					return text;
				}
			}, {
				applyToAll: true,
				excludeNestedEditable: true
			} );

		}
	}
});

/**
 * Slides CKEditor configuration.
 */
CKEDITOR.editorConfig = function( config ) {

	// Configure toolbar options
	config.toolbar = [
		[ 'Format', 'FontSize', 'TextColor' ],
		[ 'Bold', 'Italic', 'Underline', 'Strike', '-', 'RemoveFormat' ],
		[ 'NumberedList', 'BulletedList', '-', 'Blockquote' ],
		[ 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock' ],
		[ 'Link', 'Unlink' ]
	];

	config.allowedContent = {
		'h1 h2 h3 h4 h5 h6 p ul ol li blockquote span pre table col td tr': {
			styles: 'text-align,font-size,color',
			classes: 'fragment,fade-down,fade-up,fade-left,fade-right,fade-out,current-visible'
		},
		'span': {
			classes: '*'
		},
		'strong em u s del ins': true,
		'a': {
			attributes: '!href,target',
			classes: 'fragment'
		}
	};

	// Custom styles for the parts of CKE that are loaded into iframes (like dropdowns)
	config.contentsCss = '/ckeditor/slides/editor.css';

	// Always paste as plain text
	// config.forcePasteAsPlainText = true;

	// Remove word formatting
	config.pasteFromWordRemoveFontStyles = true;
	config.pasteFromWordRemoveStyles = true;

	// Don't disable browser/OS spell checking
	config.disableNativeSpellChecker = false;

	// Available font sizes (label/value)
	config.fontSize_sizes = '50%/0.5em;70%/0.7em;90%/0.9em;100%/1.0em;120%/1.2em;140%/1.4em;160%/1.6em;180%/1.8em;200%/2.0em;250%/2.5em;300%/3.0em;400%/4.0em;500%/5.0em';

	// Tags that appear in font format options
	config.format_tags = 'p;h1;h2;h3;pre';

	// Make dialogs simpler
	config.removeDialogTabs = 'image:advanced;link:advanced';

	// Enable plugins
	config.extraPlugins = 'link,font,remove-extra-nbsp,panelbutton,colorbutton';

	// Disable plugins
	config.removePlugins = 'elementspath,contextmenu';

	// Disable buttons
	config.removeButtons = 'Underline,Subscript,Superscript';

	// Don't insert invisible characters to fill empty elements
	// When this is set to false, new text blocks are unusable
	// CKEDITOR.config.fillEmptyBlocks = false;

};
