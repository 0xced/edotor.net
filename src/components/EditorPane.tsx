import * as React from "react";
import MonacoEditor from "react-monaco-editor";
import * as monacoGlobal from "monaco-editor";
import * as ls from "../dot-monaco";

type Props = {
	defaultValue?: string;
	onChangeValue(value: string): void;
	onValueError(err: monacoGlobal.editor.IMarkerData[]): void;
};

export class EditorPane extends React.Component<Props, any> {
	private processor: ls.LanguageProcessor | undefined;
	private editor: monacoGlobal.editor.IStandaloneCodeEditor | undefined;

	constructor(props: Props) {
		super(props);
		this.state = {}
	}

	public loadValue(value: string) {
		const e = this.editor;
		if (e) {
			e.setValue(value);
		}
	}

	private editorWillMount(monaco: typeof monacoGlobal): void {
		if (DEV) {
			console.log("editorWillMount");
			/*
			monaco.languages.onLanguage("dot", () => {
				console.log("Registering service...");
				const service = ls.createService();
				ls.registerService(monaco, service);
			});
			*/
		}

		const service = ls.createService();
		ls.registerService(monaco, service);
		this.processor = service.processor;
	}

	private editorDidMount(editor: monacoGlobal.editor.IStandaloneCodeEditor, monaco: typeof monacoGlobal): void {
		this.editor = editor;
		ls.registerCommands(editor);
		editor.focus();
	}

	private onChange(value: string, event: monacoGlobal.editor.IModelContentChangedEvent): void {
		const p = this.processor;
		const e = this.editor;
		if (!p || !e) return;

		const model = e.getModel();
		let markers: monacoGlobal.editor.IMarkerData[] | undefined;
		try {
			markers = p.processAndValidate(model as monacoGlobal.editor.IReadOnlyModel);
		} catch (err) {
			markers = undefined;
		}

		monacoGlobal.editor.setModelMarkers(model as monacoGlobal.editor.ITextModel, "dot", markers || []);

		const props = this.props;
		if (markers && markers.length > 0) {
			if (props.onValueError) {
				props.onValueError(markers);
			}
		} else {
			if (props.onChangeValue) {
				props.onChangeValue(value);
			}
		}
	}

	public render() {
		const defaultValue = this.props.defaultValue ? this.props.defaultValue : "";
		return (
			<MonacoEditor
				ref="editor"
				language="dot"
				defaultValue={defaultValue}
				options={{
					selectOnLineNumbers: true,
					lineNumbers: "on",
					wordWrap: "on",
					roundedSelection: false,
					scrollBeyondLastLine: false,
					minimap: { enabled: false },
					automaticLayout: true,
					folding: true,
					theme: "vs",
					glyphMargin: true,
					lightbulb: { enabled: true },
				}}
				onChange={this.onChange.bind(this)}
				editorDidMount={this.editorDidMount.bind(this)}
				editorWillMount={this.editorWillMount.bind(this)}
			/>
		);
	}
}
