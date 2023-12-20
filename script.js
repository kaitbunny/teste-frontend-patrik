$(document).ready(function(){
  //altere para o endereco ipv4 e a porta do apache da sua máquina
  const baseUrl = 'http://192.168.1.107:80/api_alphacode/'

  //deixa o label azul
  function labelBlueOnFocus() {
    $('.form-text-input input').focus(function () {
        $(this).prev('label').css('color', '#068ed0');
    }).blur(function () {
        $(this).prev('label').css('color', '');
    });
  }

  function applyMask() {
    $('.data').mask('00/00/0000');
    $('.telefone').mask('(00) 0000-0000');
    $('.celular').mask('(00) 00000-0000');
  }
  
  function validationMethodsConfig() {
    $.validator.methods.date = function(value, element) {
      var regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19[0-9]{2}|20[0-9]{2}|210[0-5])$/;
      return this.optional(element) || regex.test(value);
    };
  
    $.validator.methods.cell = function(value, element) {
      var regex = /^\(\d{2}\) \d{5}-\d{4}$/;
      return this.optional(element) || regex.test(value);
    };
  }
  
  function validationFormConfig() {
    $(".main-form").validate({
      rules: {
        nome: {
          minlength: 2
        },
        data: {
          date: true
        },
        email: {
          email: true
        },
        profissao: {
          minlength: 2
        },
        celular: {
          cell: true
        }
      },
      messages: {
        nome: {
          required: "Por favor, digite seu nome!",
          minlength: "O nome precisa ter no mínimo duas letras!"
        },
        data: "Por favor, digite uma data válida no formato dd/mm/yyyy!",
        profissao: {
          required: "Por favor, digite sua profissão!",
          minlength: "O nome da profissão precisa ter no mínimo duas letras!"
        },
        email: "Por favor, digite seu E-mail!",
        celular: "Por favor, digite um número de celular válido com 11 dígitos!"
      },
      submitHandler: function(form) {
        form.submit();
      }
    });
  }

  labelBlueOnFocus();
  applyMask();
  validationMethodsConfig();
  validationFormConfig();

  //faz a requisição para o método listar da api
  function loadContacts() {
    $.ajax({
      url: baseUrl + 'contatos/listar',
      method: 'GET',
      dataType: 'json',
      success: function (data) {
        if (data.tipo === 'sucesso' && data.resposta) {
          $('#tabela-contatos').find('tr:gt(0)').remove();
          data.resposta.forEach(addTableRow);
        }
      },
      error: function (error) {
        console.error('Erro na requisição AJAX:', error);
      }
    });
  }

  //métodos para formatar os dados exibidos da tabela
  function formatDate(data) {
    return moment(data, 'YYYY-MM-DD').format('DD/MM/YYYY');
  }

  function formatCell(celular) {
    return celular.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }

  function formatTel(telefone) {
    return telefone.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
  }

  //adiciona uma linha da tabela
  function addTableRow(contato) {
    var tabela = $('#tabela-contatos');
    var linha = $('<tr>').data('id', contato.id).append(
      $('<td>').text(contato.nome),
      $('<td>').text(formatDate(contato.nascimento)),
      $('<td>').text(contato.email),
      $('<td>').text(formatCell(contato.celular)),
      $('<td>').html('<div class="tabela-options">' +
        '<button class="editar-contato" data-id="' + contato.id + '"><img src="assets/editar.png" alt="editar"></button>' +
        '<button class="excluir-contato" data-id="' + contato.id + '"><img src="assets/excluir.png" alt="excluir"></button>' +
        '</div>')
    );
    tabela.append(linha);
  }

  //faz o cadastro de um contato
  $('#form-cadastro').submit(function (event) {
    event.preventDefault();

    //formata os dados do formulario para enviar o json
    var formDataInsert = {
      nome: $('#nome').val(),
      nascimento: moment($('#data').val(), 'DD/MM/YYYY').format('YYYY-MM-DD'),
      email: $('#email').val(),
      profissao: $('#profissao').val(),
      telefone: $('#telefone').val().replace(/\D/g, ''),
      celular: $('#celular').val().replace(/\D/g, ''),
      celularWhatsapp: $('#whatsapp').prop('checked'),
      recebeEmail: $('#emailnotif').prop('checked'),
      recebeSms: $('#sms').prop('checked')
    };

    //ajusta os valores do checkbox
    $.each(formDataInsert, function (key, value) {
      if (typeof value === 'boolean' && !value) {
        formDataInsert[key] = false;
      }
    });

    //requisição do método cadastrar na api
    $.ajax({
      url: baseUrl + 'contatos/cadastrar',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(formDataInsert),
      success: function (response) {
        loadContacts();
      },
      error: function (error) {
        //popup erro
        showErrorPopup("Cadastro de contato não realizado. Por favor, tente novamente!");
        console.error('Erro ao cadastrar contato:', error);
        loadContacts();
      }
    });

    return false;
  });

  //faz um popup de erro
  function showErrorPopup(mensagem) {
    Swal.fire('Erro!', mensagem, 'error');
  }

  //faz a exclusao de um contato
  $(document).on('click', '#tabela-contatos button.excluir-contato', function () {
    var linha = $(this).closest('tr');
    var nomeContato = linha.find('td:first').text();

    Swal.fire({
      title: 'Confirmar exclusão',
      text: 'Deseja realmente excluir o contato ' + nomeContato + '?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#068ed0',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Não, cancelar'
    }).then((result) => {
      if(result.isConfirmed) {
        var contatoId = linha.data('id');

        $.ajax({
          url: baseUrl + 'contatos/excluir/' + contatoId,
          method: 'DELETE',
          success: function (response) {
            console.log('Contato excluído com sucesso:', response);
            linha.remove();
            Swal.fire('Sucesso!', 'O contato foi excluído.', 'success');
          },
          error: function (error) {
            console.error('Erro ao excluir contato:', error);
            showErrorPopup('Ocorreu um erro ao excluir o contato.');
          }
        });
      }
    });
  });

  //faz a requisição para o método editar da api
  $(document).on('click', '#tabela-contatos button.editar-contato', function () {
    var contatoId = $(this).data('id');

    $.ajax({
      url: baseUrl + 'contatos/mostrar/' + contatoId,
      method: 'GET',
      dataType: 'json',
      success: function (data) {
        if (data.tipo === 'sucesso' && data.resposta) {
          openUpdatePopup(contatoId);
          fillTheForm(data.resposta);
        }
      },
      error: function (error) {
        showErrorPopup("Erro ao solicitar edição para o servidor. Por favor, tente novamente mais tarde!");
      }
    });
  });

  //preenche o formulário de edição com os dados atuais do contato
  function fillTheForm(contato) {
    applyMask();
    validationMethodsConfig();
    validationFormConfig();
    labelBlueOnFocus();

    $('#edit-nome').val(contato.nome);
    $('#edit-data').val(moment(contato.nascimento).format('DD/MM/YYYY'));
    $('#edit-email').val(contato.email);
    $('#edit-profissao').val(contato.profissao);
    $('#edit-telefone').val(formatTel(contato.telefone));
    $('#edit-celular').val(formatCell(contato.celular));
    $('#edit-whatsapp').prop('checked', contato.celularWhatsapp);
    $('#edit-emailnotif').prop('checked', contato.recebeEmail);
    $('#edit-sms').prop('checked', contato.recebeSms);
  }

  //abre o pop up de edição e caso o usuário clique em editar ele faz a requisição para o método editar da api
  function openUpdatePopup(contatoId) {
    Swal.fire({
      title: 'Editar Contato',
      width: 1000,
      html: `
        <main class="container no-margin-bottom">
        <form id="form-atualizar" class="main-form">
          <div class="form-text-input">
            <label for="edit-nome">Nome completo</label>
            <input type="text" id="edit-nome" name="nome" placeholder="Ex.: Patrik Pereira dos Santos" required>
          </div>
          <div class="form-text-input">
            <label for="edit-data">Data de nascimento</label>
            <input class="data" type="text" id="edit-data" name="data" placeholder="Ex.: 12/05/2003" required>
          </div>
          <div class="form-text-input">
            <label for="edit-email">E-mail</label>
            <input type="email" id="edit-email" name="email" placeholder="Ex.: patrik@gmail.com" required>
          </div>
          <div class="form-text-input">
            <label for="edit-profissao">Profissão</label>
            <input type="text" id="edit-profissao" name="profissao" placeholder="Ex.: Desenvolvedor Backend" required>
          </div>
          <div class="form-text-input">
            <label for="edit-telefone">Telefone para contato</label>
            <input class="telefone" type="text" id="edit-telefone" name="telefone" placeholder="Ex.: (11) 4002-8922">
          </div>
          <div class="form-text-input">
            <label for="edit-celular">Celular para contato</label>
            <input class="celular" type="text" id="edit-celular" name="celular" placeholder="Ex.: (11) 98493-2039" required>
          </div>
          <div class="form-checkbox-input margin-top">
            <input type="checkbox" id="edit-whatsapp" name="whatsapp">
            <label for="edit-whatsapp">Número de celular possui Whatsapp</label>
          </div>
          <div class="form-checkbox-input margin-top">
            <input type="checkbox" id="edit-emailnotif" name="emailnotif">
            <label for="edit-emailnotif">Enviar notificações por E-mail</label>
          </div>
          <div class="form-checkbox-input">
            <input type="checkbox" id="edit-sms" name="sms">
            <label for="edit-sms">Enviar notificações por SMS</label>
          </div>
        </form>
      </main>
      `,
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Atualizar Contato',
      preConfirm: function () {
          var formDataUpdate = {
            nome: $('#edit-nome').val(),
            nascimento: moment($('#edit-data').val(), 'DD/MM/YYYY').format('YYYY-MM-DD'),
            email: $('#edit-email').val(),
            profissao: $('#edit-profissao').val(),
            telefone: $('#edit-telefone').val().replace(/\D/g, ''),
            celular: $('#edit-celular').val().replace(/\D/g, ''),
            celularWhatsapp: $('#edit-whatsapp').prop('checked'),
            recebeEmail: $('#edit-emailnotif').prop('checked'),
            recebeSms: $('#edit-sms').prop('checked')
          };
  
          $.each(formDataUpdate, function (key, value) {
            if (typeof value === 'boolean' && !value) {
              formDataUpdate[key] = false;
            }
          });
          
          return $.ajax({
            url: baseUrl + 'contatos/editar/' + contatoId,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(formDataUpdate),
            success: function (result) {
              if(result.tipo === 'sucesso') {
                Swal.fire('Sucesso!', 'O contato foi atualizado com sucesso.', 'success').then(() => {
                  location.reload(true)
                });
              }
              else {
                showErrorPopup('O contato não foi atualizado.');
              }
            },
            error: function (error) {
              showErrorPopup('Ocorreu um erro durante a atualização do contato.');
            }
          });
        } 
    })
  }

  //carrega os contatos
  loadContacts();
});
