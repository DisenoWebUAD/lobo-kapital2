export type PrivacyBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: readonly string[] };

export interface PrivacySection {
  id: string;
  title: string;
  blocks: readonly PrivacyBlock[];
}

export const privacySections: readonly PrivacySection[] = [
  {
    "id": "datos",
    "title": "Datos personales que podrán tratarse",
    "blocks": [
      {
        "kind": "paragraph",
        "text": "Dependiendo de la naturaleza del producto, servicio, solicitud u operación, Lobos podrá tratar las siguientes categorías de datos:"
      },
      {
        "kind": "list",
        "items": [
          "Datos de identificación y contacto.",
          "Datos fiscales y relacionados con la actividad económica.",
          "Datos laborales y económicos.",
          "Datos financieros, patrimoniales y crediticios.",
          "Datos de cumplimiento y prevención de operaciones con recursos de procedencia ilícita y financiamiento al terrorismo (PLD/FT).",
          "Datos tecnológicos y digitales generados por los canales efectivamente utilizados, tales como dirección IP, fecha y hora, identificador de sesión o solicitud, navegador, dispositivo, registros de acceso y eventos relevantes del flujo."
        ]
      },
      {
        "kind": "paragraph",
        "text": "Cuando la contratación o identificación se realice por medios no presenciales y resulte aplicable, Lobos podrá requerir la geolocalización del dispositivo. La biometría facial, prueba de vida u otros datos de naturaleza sensible sólo serán tratados cuando el proceso efectivamente los requiera, exista una finalidad legítima y se cumplan previamente los requisitos de información y consentimiento aplicables."
      }
    ]
  },
  {
    "id": "fuentes",
    "title": "Fuentes de obtención",
    "blocks": [
      {
        "kind": "paragraph",
        "text": "Lobos podrá obtener datos directamente de la persona titular; de representantes, apoderados o personas autorizadas; de Personas Morales con las que se encuentre vinculada; de fuentes de acceso público permitidas por la legislación; de Sociedades de Información Crediticia cuando exista la autorización correspondiente; de autoridades o registros cuya consulta esté legalmente permitida; y de personas encargadas o proveedores que participen en procesos de validación, autenticación, operación o cumplimiento conforme a las instrucciones de Lobos."
      }
    ]
  },
  {
    "id": "finalidades",
    "title": "Finalidades primarias y necesarias",
    "blocks": [
      {
        "kind": "list",
        "items": [
          "Identificar y contactar a prospectos, solicitantes, Clientes, Usuarios y personas relacionadas.",
          "Recibir, registrar, evaluar y dar seguimiento a solicitudes de productos o servicios financieros.",
          "Verificar identidad, personalidad, facultades, información y documentación; realizar procesos KYC/KYB; e identificar, cuando corresponda, representantes, apoderados, socios, accionistas, personas que ejerzan Control, Propietarios Reales, Proveedores de Recursos, avales, obligados solidarios, garantes y demás personas relacionadas.",
          "Integrar, revisar, conservar y actualizar expedientes físicos o digitales.",
          "Realizar análisis crediticio, financiero, patrimonial, operativo, de capacidad de pago y de riesgo.",
          "Consultar y, cuando corresponda, proporcionar información a Sociedades de Información Crediticia conforme al régimen aplicable.",
          "Formalizar, administrar, operar, modificar, renovar o terminar contratos; ejecutar disposiciones, pagos, cobros, conciliaciones, facturación, estados de cuenta y cobranza.",
          "Atender consultas, aclaraciones y reclamaciones.",
          "Cumplir obligaciones en materia de PLD/FT; prevenir y atender fraude, suplantación de identidad, operaciones ilícitas o usos no autorizados.",
          "Cumplir requerimientos de autoridades, conservar evidencia y ejercer, reconocer, acreditar o defender derechos derivados de una relación jurídica."
        ]
      }
    ]
  },
  {
    "id": "secundarias",
    "title": "Finalidades secundarias",
    "blocks": [
      {
        "kind": "paragraph",
        "text": "Cuando exista el consentimiento o base jurídica correspondiente, Lobos podrá tratar datos de identificación y contacto para publicidad, prospección comercial, encuestas de satisfacción y comunicaciones promocionales o relacionadas con nuevos productos o servicios. Estas finalidades no son indispensables para mantener la relación jurídica."
      },
      {
        "kind": "paragraph",
        "text": "La persona titular podrá manifestar su negativa o solicitar que sus datos dejen de utilizarse para estas finalidades mediante el correo datos.personales.lobos@lobokapital.mx."
      }
    ]
  },
  {
    "id": "consentimiento",
    "title": "Consentimiento y revocación",
    "blocks": [
      {
        "kind": "paragraph",
        "text": "Lobos recabará el consentimiento de la persona titular cuando resulte legalmente exigible. Tratándose de datos financieros o patrimoniales, cuando no resulte aplicable una excepción legal, el consentimiento será expreso y se conservará evidencia de su otorgamiento. Si llegaran a tratarse datos personales sensibles, se obtendrá el consentimiento que corresponda conforme a la legislación aplicable."
      },
      {
        "kind": "paragraph",
        "text": "La persona titular podrá revocar el consentimiento respecto de tratamientos que dependan de éste, sin efectos retroactivos, mediante solicitud enviada a datos.personales.lobos@lobokapital.mx. La revocación no procederá respecto de tratamientos que deban continuar por disposición legal, cumplimiento regulatorio, relación jurídica vigente, conservación de evidencia o ejercicio y defensa de derechos."
      }
    ]
  },
  {
    "id": "transferencias",
    "title": "Transferencias y personas encargadas",
    "blocks": [
      {
        "kind": "paragraph",
        "text": "Lobos podrá comunicar o transferir datos personales a autoridades competentes cuando exista obligación, requerimiento o fundamento legal; a Sociedades de Información Crediticia conforme al régimen aplicable; y a instituciones, participantes, fedatarios, valuadores, aseguradoras, cesionarios, adquirentes u otros terceros cuando su intervención sea necesaria para formalizar, ejecutar, administrar, cobrar, transmitir o cumplir una operación o relación jurídica. Cuando una transferencia requiera consentimiento, éste será recabado y conservado de forma verificable."
      },
      {
        "kind": "paragraph",
        "text": "Los proveedores que traten datos personales únicamente por cuenta y siguiendo instrucciones de Lobos actuarán como personas encargadas y deberán sujetarse a las obligaciones de confidencialidad, seguridad y tratamiento aplicables. Lobos podrá utilizar proveedores tecnológicos y operativos para soportar sus procesos; su intervención no modifica la responsabilidad de Lobos respecto del tratamiento informado."
      }
    ]
  },
  {
    "id": "limitacion",
    "title": "Limitación del uso o divulgación",
    "blocks": [
      {
        "kind": "paragraph",
        "text": "La persona titular podrá solicitar la limitación del uso o divulgación de sus datos personales, particularmente respecto de finalidades secundarias, mediante el correo datos.personales.lobos@lobokapital.mx, sin perjuicio de los mecanismos públicos de exclusión que resulten aplicables."
      }
    ]
  },
  {
    "id": "arco",
    "title": "Derechos ARCO",
    "blocks": [
      {
        "kind": "paragraph",
        "text": "La persona titular, o su representante legal, podrá ejercer los derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO) mediante solicitud dirigida a Lobos al correo datos.personales.lobos@lobokapital.mx. La solicitud deberá contener los elementos necesarios para identificar a la persona titular, acreditar su identidad y, en su caso, representación; describir el derecho que pretende ejercer y los datos involucrados; e incluir los elementos que faciliten su localización. En solicitudes de rectificación deberán indicarse las modificaciones solicitadas y acompañarse la documentación que las sustente."
      },
      {
        "kind": "paragraph",
        "text": "Lobos comunicará la determinación adoptada dentro del plazo legal aplicable y, cuando resulte procedente, hará efectivo el derecho dentro del plazo correspondiente."
      }
    ]
  },
  {
    "id": "tecnologias",
    "title": "Tecnologías y medios digitales",
    "blocks": [
      {
        "kind": "paragraph",
        "text": "Cuando Lobos utilice sitios, portales, aplicaciones, formularios u otros medios digitales, podrá generar registros técnicos necesarios para autenticación, seguridad, trazabilidad y evidencia. La aceptación digital del Aviso podrá conservar folio del Cliente, fecha y hora, versión aceptada, IP/dispositivo y resultado; cuando se utilice firma electrónica u otro mecanismo de autenticación, la evidencia correspondiente podrá quedar asociada al expediente digital."
      },
      {
        "kind": "paragraph",
        "text": "La geolocalización, biometría facial, prueba de vida u otras tecnologías sólo serán utilizadas cuando el canal, producto o proceso las requiera y se encuentren debidamente habilitadas, informadas y soportadas conforme al marco aplicable."
      }
    ]
  },
  {
    "id": "conservacion",
    "title": "Seguridad, confidencialidad y conservación",
    "blocks": [
      {
        "kind": "paragraph",
        "text": "Lobos mantendrá medidas administrativas, técnicas y físicas razonables y proporcionales para proteger los datos personales contra daño, pérdida, alteración, destrucción, uso, acceso o tratamiento no autorizado. Quienes intervengan en cualquier fase del tratamiento deberán guardar confidencialidad incluso después de concluir la relación que haya dado origen a su acceso."
      },
      {
        "kind": "paragraph",
        "text": "Los datos personales serán conservados durante los periodos necesarios para cumplir las finalidades informadas y los plazos legales, regulatorios, fiscales, mercantiles, contractuales, de PLD/FT y de defensa de derechos que resulten aplicables."
      }
    ]
  },
  {
    "id": "cambios",
    "title": "Cambios al Aviso",
    "blocks": [
      {
        "kind": "paragraph",
        "text": "Lobos podrá modificar o actualizar este Aviso cuando existan cambios legales, regulatorios, corporativos, operativos, tecnológicos, de productos, servicios, procesos o tratamientos. Las modificaciones se comunicarán mediante su publicación en el sitio oficial de Lobos y, cuando el cambio sea material y se cuente con el medio disponible, mediante correo electrónico u otro canal de contacto. Cuando el cambio requiera un nuevo consentimiento, éste será recabado antes de realizar el nuevo tratamiento."
      }
    ]
  },
  {
    "id": "autoridad",
    "title": "Autoridad competente",
    "blocks": [
      {
        "kind": "paragraph",
        "text": "Si la persona titular considera vulnerado su derecho a la protección de datos personales, podrá ejercer los medios de protección previstos en la legislación aplicable ante la autoridad competente, sin perjuicio de los demás medios legales que correspondan."
      }
    ]
  }
];
