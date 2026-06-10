package schema

type FieldType string

const (
	TypeString  FieldType = "string"
	TypeInt     FieldType = "int"
	TypeFloat   FieldType = "float"
	TypeBool    FieldType = "bool"
	TypeDate    FieldType = "date"
	TypeDateTime FieldType = "datetime"
	TypeEmail   FieldType = "email"
	TypeURL     FieldType = "url"
	TypeEnum    FieldType = "enum"
	TypePattern FieldType = "pattern"
)

type FieldSchema struct {
	Name        string      `json:"name"`
	Type        FieldType   `json:"type"`
	Required    bool        `json:"required,omitempty"`
	Unique      bool        `json:"unique,omitempty"`
	Description string      `json:"description,omitempty"`
	EnumValues  []string    `json:"enum_values,omitempty"`
	Pattern     string      `json:"pattern,omitempty"`
	DateFormat  string      `json:"date_format,omitempty"`
	MinLength   *int        `json:"min_length,omitempty"`
	MaxLength   *int        `json:"max_length,omitempty"`
	MinValue    *float64    `json:"min_value,omitempty"`
	MaxValue    *float64    `json:"max_value,omitempty"`
	Nullable    bool        `json:"nullable,omitempty"`
	TrimSpace   *bool       `json:"trim_space,omitempty"`
}

type Schema struct {
	Name        string        `json:"name"`
	Description string        `json:"description,omitempty"`
	Version     string        `json:"version,omitempty"`
	Fields      []FieldSchema `json:"fields"`
	PrimaryKeys []string      `json:"primary_keys,omitempty"`
	UniqueKeys  [][]string    `json:"unique_keys,omitempty"`
	Delimiter   string        `json:"delimiter,omitempty"`
	HasHeader   *bool         `json:"has_header,omitempty"`
	Encoding    string        `json:"encoding,omitempty"`
}

func (s *Schema) GetField(name string) (*FieldSchema, bool) {
	for i := range s.Fields {
		if s.Fields[i].Name == name {
			return &s.Fields[i], true
		}
	}
	return nil, false
}

func (s *Schema) FieldNames() []string {
	names := make([]string, len(s.Fields))
	for i, f := range s.Fields {
		names[i] = f.Name
	}
	return names
}

func (s *Schema) RequiredFields() []string {
	var req []string
	for _, f := range s.Fields {
		if f.Required {
			req = append(req, f.Name)
		}
	}
	return req
}

func (s *Schema) UniqueFields() []string {
	var uniq []string
	for _, f := range s.Fields {
		if f.Unique {
			uniq = append(uniq, f.Name)
		}
	}
	return uniq
}
