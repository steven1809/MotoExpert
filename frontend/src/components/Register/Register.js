<<<<<<< HEAD
import { useState } from 'react';
import { API_BASE_URL } from '../../apiConfig';
=======
import React, { Component } from 'react';
import emailjs from '@emailjs/browser';
import { API_BASE_URL } from '../../apiConfig';

class Register extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nombre: '',
      apellidos: '', // Coincide con el DTO del backend
      email: '',
      password: '',
      documento: '', // Coincide con el DTO del backend
      telefono: '',
      aceptaTerminos: false, // Requerido por el DTO
      message: { text: '', isError: false },
      cargando: false
    };
  }
>>>>>>> 904ae239af2591971bbcf43441af60c6ca0ebd3e

  handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    this.setState({
      [e.target.name]: value
    });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    this.setState({ message: { text: '', isError: false }, cargando: true });

    const { nombre, apellidos, email, password, documento, telefono, aceptaTerminos } = this.state;

    // Validaciones de frontend
    if (!aceptaTerminos) {
      this.setState({
        message: { text: 'Debes aceptar los términos y condiciones para continuar', isError: true },
        cargando: false
      });
      return;
    }

    if (password.length < 8) {
      this.setState({
        message: { text: 'La contraseña debe tener al menos 8 caracteres', isError: true },
        cargando: false
      });
      return;
    }

    if (!/(?=.*[A-Z])(?=.*\d)/.test(password)) {
      this.setState({
        message: { text: 'La contraseña debe contener al menos una mayúscula y un número', isError: true },
        cargando: false
      });
      return;
    }

    if (formData.password.length < 8) {
      setMessage({ text: 'La contraseña debe tener al menos 8 caracteres', isError: true });
      return;
    }

    if (!/(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setMessage({ text: 'La contraseña debe contener al menos una mayúscula y un número', isError: true });
      return;
    }

    try {
      // 1. Registrar el usuario en la API de MotoExpert
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre, apellidos, email, password, documento, telefono, aceptaTerminos }),
      });

      // Validamos si la respuesta es un JSON válido antes de leerla
      const contentType = response.headers.get("content-type");
      let data = {};
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        const textError = await response.text();
        throw new Error(`El servidor no respondió con JSON. Código: ${response.status}. Detalle: ${textError}`);
      }

      if (response.ok) {
        // 2. Si el backend responde OK, disparamos el correo con EmailJS
        const templateParams = {
          user_name: `${nombre} ${apellidos}`.trim(),
          user_email: email,
          user_id: documento || 'No proporcionado',
          user_phone: telefono || 'No proporcionado'
        };

        const SERVICE_ID = 'service_1zw6lr5';
        const TEMPLATE_ID = 'template_ke3m9t4';
        const PUBLIC_KEY = 'DnCU3e4N9NdapUEmI';

        try {
          await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
          console.log('¡Correo de bienvenida enviado con éxito!');
        } catch (emailError) {
          console.error('Error al enviar el correo mediante EmailJS:', emailError);
        }

        // 3. Limpiar el estado tras el éxito completo
        this.setState({
          message: { text: '¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.', isError: false },
          cargando: false,
          nombre: '', apellidos: '', email: '', password: '', documento: '', telefono: '', aceptaTerminos: false
        });

        if (this.props.onSuccess) this.props.onSuccess();
        
      } else {
        // Si el backend responde con un error controlado (ej: Email duplicado)
        let msgError = 'Error al registrar';
        if (data.message) {
          msgError = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        }
        this.setState({
          message: { text: msgError, isError: true },
          cargando: false
        });
      }
    } catch (error) {
      console.error('Error en registro:', error);
      this.setState({
        message: { text: `Error crítico: ${error.message || 'No se pudo conectar con el servidor'}`, isError: true },
        cargando: false
      });
    }
  };

  render() {
    const { nombre, apellidos, email, password, documento, telefono, aceptaTerminos, message, cargando } = this.state;

    return (
      <div>
        <h2 className="text-2xl font-bold mb-4 text-white">Registro de Usuario</h2>
        <form onSubmit={this.handleSubmit} className="space-y-4">
          {message.text && (
            <div className={message.isError ? "text-red-400 text-sm font-bold" : "text-green-400 text-sm font-bold"}>
              {message.text}
            </div>
          )}
          <input
            type="text"
            name="nombre"
            placeholder="Nombre"
            value={nombre}
            onChange={this.handleChange}
            className="border border-slate-600 p-3 w-full bg-slate-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            name="apellidos"
            placeholder="Apellidos"
            value={apellidos}
            onChange={this.handleChange}
            className="border border-slate-600 p-3 w-full bg-slate-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={this.handleChange}
            className="border border-slate-600 p-3 w-full bg-slate-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            name="documento"
            placeholder="Cédula / Documento de Identidad"
            value={documento}
            onChange={this.handleChange}
            className="border border-slate-600 p-3 w-full bg-slate-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="tel"
            name="telefono"
            placeholder="Teléfono"
            value={telefono}
            onChange={this.handleChange}
            className="border border-slate-600 p-3 w-full bg-slate-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={password}
            onChange={this.handleChange}
            className="border border-slate-600 p-3 w-full bg-slate-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="aceptaTerminos"
              checked={aceptaTerminos}
              onChange={this.handleChange}
              id="aceptaTerminos"
              className="w-4 h-4 rounded border-slate-500"
              required
            />
            <label htmlFor="aceptaTerminos" className="text-slate-300 text-sm">
              Acepto los términos y condiciones
            </label>
          </div>
          <button 
            type="submit" 
            disabled={cargando}
            className={`w-full p-3 rounded-lg font-bold transition-all ${
              cargando 
                ? 'bg-slate-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {cargando ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
      </div>
    );
  }
}

export default Register;
